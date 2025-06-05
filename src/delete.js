import inquirer from "inquirer";
import ora from "ora";
import {
  getCurrentBranch,
  log,
  getLocalBranches,
  deleteBranch,
  checkWorkingDirectory,
} from "./utils.js";

/**
 * 交互式删除分支
 * @param {Object} options - 配置选项
 * @param {boolean} options.force - 是否强制删除
 * @param {boolean} options.multi - 是否允许多选
 * @param {boolean} options.debug - 是否打印日志
 * @returns {Promise<void>}
 */
export const deleteBranches = async (options = {}) => {
  // 检测是否为 git 仓库
  if (!(await checkWorkingDirectory())) return process.exit(1);

  const { force = false, multi = false } = options;
  const spinner = ora({
    text: "正在获取分支列表...",
    discardStdin: false,
  }).start();

  const currentBranch = await getCurrentBranch();
  const branches = await getLocalBranches();

  // 取消 spinner
  spinner.text = "";
  spinner.stop();

  if (branches.length === 0) {
    console.info("没有找到任何分支");
    return process.exit(0);
  }

  log("info", "获取分支列表成功", options, branches);

  // 如果分支中只有当前分支，则给出提示
  if (branches.length === 1) {
    console.info("没有可删除的本地分支");
    return process.exit(0);
  }

  try {
    let { selectedBranches } = await inquirer.prompt([
      {
        type: multi ? "checkbox" : "list",
        name: "selectedBranches",
        message: "请选择要删除的分支:",
        choices: branches.map((branch) => ({
          name: branch === currentBranch ? `${branch} (当前分支)` : branch,
          value: branch,
          disabled: branch === currentBranch,
        })),
        validate: (input) => {
          if (input.length === 0) {
            return "请至少选择一个分支";
          }
          return true;
        },
      },
    ]);

    log("info", "选择的分支是", options, selectedBranches);

    if (selectedBranches.length === 0) {
      log("info", "未选择任何分支，操作取消");
      return;
    }

    // 数据处理，单个分支的进行处理成数组
    if (typeof selectedBranches === "string") {
      selectedBranches = [selectedBranches];
    }

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `确定要删除选中的 ${selectedBranches.length} 个分支吗？`,
        default: true,
      },
    ]);

    if (!confirm) {
      log("info", "操作已取消");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const branch of selectedBranches) {
      const success = await deleteBranch(branch, force);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.info(`删除完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);
  } catch (error) {
    if (error.name === "ExitPromptError") {
      process.exit(0);
    }
    throw error;
  }
};
