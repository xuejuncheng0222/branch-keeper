import inquirer from "inquirer";
import ora from "ora";
import {
  getCurrentBranch,
  log,
  getLocalBranches,
  checkWorkingDirectory,
  checkoutBranch,
  hasUncommittedChanges,
  stashChanges,
} from "./utils.js";

/**
 * 交互式切换分支
 * @param {Object} options - 配置选项
 * @param {boolean} options.debug - 是否打印调试日志
 * @returns {Promise<void>}
 */
export const switchBranch = async (options = {}) => {
  // 检测是否为 git 仓库
  if (!(await checkWorkingDirectory())) return process.exit(1);

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
    console.info("没有可切换的本地分支");
    return process.exit(0);
  }

  try {
    const { targetBranch } = await inquirer.prompt([
      {
        type: "list",
        name: "targetBranch",
        message: "请选择要切换到的分支:",
        choices: branches.map((branch) => ({
          name: branch === currentBranch ? `${branch} (当前分支)` : branch,
          value: branch,
          disabled: branch === currentBranch,
        })),
      },
    ]);

    log("info", "选择的分支是", options, targetBranch);

    // 检查工作区是否干净 如果不干净给出是否暂存内容
    if (await hasUncommittedChanges()) {
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "检查到存在未提交的更改，是否先暂存改动后切换",
          default: true,
        },
      ]);
      if (!confirm) {
        return process.exit(0);
      } else {
        // 执行暂存的脚本
        await stashChanges();
      }
    }

    const success = await checkoutBranch(targetBranch, false, options);

    if (!success) {
      console.error("切换分支失败");
      return;
    }

    console.info(`成功切换到分支: ${targetBranch}`);
    log("info", "切换分支成功", options, {
      from: currentBranch,
      to: targetBranch,
    });
  } catch (error) {
    if (error.name === "ExitPromptError") {
      process.exit(0);
    }
    throw error;
  }
};
