/**
 * 远程分支拉取工具
 * 用于从远程仓库拉取分支并创建本地分支
 */

import {
  execGitCommand,
  isGitRepository,
  getCurrentBranch,
  branchExists,
  hasUncommittedChanges,
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
 * 获取远程分支列表
 * @param {string} remote - 远程仓库名
 * @returns {Promise<string[]>} 远程分支列表
 */
const getRemoteBranches = async (remote, options) => {
  try {
    const { stdout } = await execGitCommand(`git ls-remote --heads ${remote}`);
    return stdout
      .split("\n")
      .filter(Boolean)
      .map((line) => line.split("\t")[1].replace("refs/heads/", ""));
  } catch (error) {
    log("error", `获取远程分支列表失败: ${error.message}`, options);
    return [];
  }
};

/**
 * 创建跟踪分支
 * @param {string} branch - 分支名
 * @param {Object} options - 配置选项
 * @returns {Promise<boolean>} 是否创建成功
 */
const createTrackingBranch = async (branch, options) => {
  const { remote, force = false } = options;

  try {
    if (await branchExists(branch)) {
      if (!force) {
        log("info", `分支 ${branch} 已存在，跳过`, options);
        return true;
      }

      log("info", `强制更新分支 ${branch}`, options);
      await execGitCommand(`git branch -D ${branch}`);
    }

    await execGitCommand(`git checkout -b ${branch} ${remote}/${branch}`);
    log("info", `成功创建分支 ${branch}`, options);
    return true;
  } catch (error) {
    log("error", `创建分支 ${branch} 失败: ${error.message}`, options);
    return false;
  }
};

/**
 * 拉取所有远程分支
 * @param {Object} options - 配置选项
 * @param {string} options.remote - 远程仓库名
 * @param {string[]} options.ignore - 要忽略的分支列表
 * @param {boolean} options.force - 是否强制更新
 * @param {boolean} options.silent - 是否静默模式
 * @returns {Promise<void>}
 */
export const fetchAllBranches = async (options) => {
  const {
    remote = "origin",
    ignore = [],
    force = false,
    silent = false,
  } = options;

  if (!(await checkWorkingDirectory(options))) {
    return;
  }

  const currentBranch = await getCurrentBranch();
  let remoteBranches = await getRemoteBranches(remote, options);

  if (remoteBranches.length === 0) {
    log("info", "没有找到远程分支", options);
    return;
  }

  log("info", `找到 ${remoteBranches.length} 个远程分支`, options);

  let successCount = 0;
  let failCount = 0;

  for (const branch of remoteBranches) {
    if (ignore.includes(branch)) {
      log("info", `忽略分支 ${branch}`, options);
      continue;
    }

    const success = await createTrackingBranch(branch, { remote, force });
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
      `拉取完成: 成功 ${successCount} 个, 失败 ${failCount} 个`,
      options
    );
  }
};
