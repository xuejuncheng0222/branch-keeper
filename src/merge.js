/**
 * 分支合并模块
 * 用于将源分支的更改合并到多个目标分支
 */

import {
  execGitCommand,
  isGitRepository,
  getCurrentBranch,
  branchExists,
  hasUncommittedChanges,
  hasUnpushedCommits,
  log,
} from "./utils.js";

/**
 * 检查工作目录状态
 * @returns {Promise<boolean>} 是否可以继续操作
 */
const checkWorkingDirectory = async (options) => {
  if (!(await isGitRepository())) {
    log("error", "当前目录不是 Git 仓库", options);
    return false;
  }

  if (await hasUncommittedChanges()) {
    log("error", "工作区有未提交的更改，请先提交或暂存更改", options);
    return false;
  }

  return true;
};

/**
 * 检查源分支状态
 * @param {string} source - 源分支名
 * @returns {Promise<boolean>} 是否可以继续操作
 */
const checkSourceBranch = async (source, options) => {
  if (!(await branchExists(source))) {
    log("error", `源分支 ${source} 不存在`, options);
    return false;
  }

  if (await hasUnpushedCommits(source)) {
    log("error", `源分支 ${source} 有未推送的提交`, options);
    return false;
  }

  return true;
};

/**
 * 合并分支
 * @param {string} source - 源分支名
 * @param {string} target - 目标分支名
 * @param {Object} options - 配置选项
 * @returns {Promise<boolean>} 是否合并成功
 */
const mergeBranch = async (source, target, options) => {
  const { ffOnly = true } = options;

  try {
    await execGitCommand(`git checkout ${target}`);
    const mergeCommand = ffOnly
      ? `git merge --ff-only ${source}`
      : `git merge --no-ff ${source}`;
    await execGitCommand(mergeCommand);
    log("info", `成功将 ${source} 合并到 ${target}`, options);
    return true;
  } catch (error) {
    log("error", `合并分支失败: ${error.message}`, options);
    return false;
  }
};

/**
 * 合并到多个分支
 * @param {Object} options - 配置选项
 * @param {string} options.source - 源分支名
 * @param {string[]} options.target - 目标分支列表
 * @param {string[]} options.exclude - 要排除的分支列表
 * @param {boolean} options.ffOnly - 是否只允许快进合并
 * @param {boolean} options.silent - 是否静默模式
 * @returns {Promise<void>}
 */
export const mergeToBranches = async (options) => {
  const {
    source,
    target = [],
    exclude = [],
    ffOnly = true,
    silent = false,
  } = options;

  if (!(await checkWorkingDirectory(options))) {
    return;
  }

  if (!(await checkSourceBranch(source, options))) {
    return;
  }

  const currentBranch = await getCurrentBranch();
  let targetBranches = target;

  if (targetBranches.length === 0) {
    try {
      const { stdout } = await execGitCommand(
        "git branch --format='%(refname:short)'"
      );
      targetBranches = stdout.split("\n").filter(Boolean);
    } catch (error) {
      log("error", "获取分支列表失败", options);
      return;
    }
  }

  // 过滤要排除的分支
  targetBranches = targetBranches.filter(
    (branch) => branch !== source && !exclude.includes(branch)
  );

  if (targetBranches.length === 0) {
    log("info", "没有需要合并的目标分支", options);
    return;
  }

  if (!silent) {
    log("info", `将要合并到以下分支:`, options);
    targetBranches.forEach((branch) => log("info", `- ${branch}`, options));
  }

  let successCount = 0;
  let failCount = 0;

  for (const branch of targetBranches) {
    const success = await mergeBranch(branch, source, options);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // 返回原分支
  try {
    await execGitCommand(`git checkout ${currentBranch}`);
  } catch (error) {
    log("error", `返回原分支 ${currentBranch} 失败: ${error.message}`, options);
  }

  if (!silent) {
    log(
      "info",
      `合并完成: 成功 ${successCount} 个, 失败 ${failCount} 个`,
      options
    );
  }
};
