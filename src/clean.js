/**
 * 分支清理模块
 * 用于清理本地已合并但远程已删除的分支
 */

import {
  execGitCommand,
  isGitRepository,
  getCurrentBranch,
  branchExists,
  hasUncommittedChanges,
  isProtectedBranch,
  log,
} from "./utils.js";

/**
 * 检查工作目录状态 合并等操作需求工作区干净，删除分支的操作不需要
 * @param {boolean} checkCommit - 是否检查未提交的更改
 * @returns {Promise<boolean>} 是否可以继续操作
 */
const checkWorkingDirectory = async (checkCommit = false) => {
  if (!(await isGitRepository())) {
    console.error("当前目录不是 Git 仓库");
    return false;
  }

  if (checkCommit && (await hasUncommittedChanges())) {
    console.error("工作区有未提交的更改，请先提交或暂存更改");
    return false;
  }

  return true;
};

/**
 * 获取本地分支列表
 * @returns {Promise<string[]>} 本地分支列表
 */
const getLocalBranches = async () => {
  try {
    // 获取所有的本地分支
    const { stdout } = await execGitCommand(
      "git branch --format='%(refname:short)'"
    );
    return stdout
      .split("\n")
      .map((name) => name.replace(/^'+|'+$/g, ""))
      .filter(Boolean);
  } catch (error) {
    log("error", "获取本地分支列表失败");
    return [];
  }
};

/**
 * 检查远程分支是否存在
 * @param {string} branch - 分支名
 * @param {string} remote - 远程仓库名
 * @returns {Promise<boolean>} 远程分支是否存在
 */
const checkRemoteBranch = async (branch, remote) => {
  try {
    const { stdout } = await execGitCommand(
      `git ls-remote --heads ${remote} ${branch}`
    );
    log("info", `检查远程分支 ${branch} 是否存在: ${stdout.trim().length > 0}`);
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * 删除分支
 * @param {string} branch - 分支名
 * @param {boolean} force - 是否强制删除
 * @returns {Promise<boolean>} 是否删除成功
 */
const deleteBranch = async (branch, force = false) => {
  try {
    const command = force
      ? `git branch -D ${branch}`
      : `git branch -d ${branch}`;
    await execGitCommand(command);
    log("info", `成功删除分支: ${branch}`);
    return true;
  } catch (error) {
    log("error", `删除分支 ${branch} 失败: ${error.message}`);
    return false;
  }
};

/**
 * 清理本地分支
 * @param {Object} options - 配置选项
 * @param {string[]} options.remotes - 远程仓库列表
 * @param {string[]} options.ignore - 要忽略的分支列表
 * @param {boolean} options.force - 是否强制删除
 * @param {boolean} options.listOnly - 是否只列出要删除的分支
 * @param {boolean} options.silent - 是否静默模式
 * @returns {Promise<void>}
 */
export const cleanBranches = async (options) => {
  const {
    ignore = [],
    force = false,
    listOnly = false,
    silent = false,
    protectedBranches = [],
  } = options;

  if (!(await checkWorkingDirectory())) {
    return;
  }

  /**当前分支名 */
  const currentBranch = await getCurrentBranch();
  log("info", `当前分支 ${currentBranch}`, options);
  /**本地分支及其上游分支列表 */
  let trackingBranches = [];
  try {
    const { stdout } = await execGitCommand(
      'git for-each-ref --format="%(refname:short) %(upstream:short)" refs/heads'
    );
    log("info", `获取本地分支及其上游分支列表: \n${stdout}`, options);
    trackingBranches = stdout
      .split("\n")
      .map((line) => line.trim().split(" "))
      .filter(
        ([branch, upstream]) => branch && upstream && upstream !== "(null)"
      );
  } catch (error) {
    log("error", "获取本地分支的上游分支信息失败", options);
    return;
  }

  /**需要删除的分支列表 */
  const branchesToDelete = [];

  log(
    "info",
    `本地分支及其上游分支列表: ${JSON.stringify(trackingBranches)}`,
    options
  );

  for (const [branch, upstream] of trackingBranches) {
    // 当前分支 忽略分支 受保护分支 不删除
    if (
      branch === currentBranch ||
      ignore.includes(branch) ||
      isProtectedBranch(branch, protectedBranches)
    ) {
      continue;
    }
    // upstream 形如 origin/feature/foo
    const [remote, ...branchParts] = upstream.split("/");
    // 远程分支名
    const remoteBranch = branchParts.join("/");
    log("info", `检查远程分支 ${remoteBranch} 是否存在: ${remote}`, options);
    // 检查远程分支是否存在
    const exists = await checkRemoteBranch(remoteBranch, remote);
    // 不存在则加入删除列表
    if (!exists) {
      branchesToDelete.push(branch);
    }
  }

  if (branchesToDelete.length === 0) {
    console.info("没有需要清理的分支");
    return;
  }

  if (!silent) {
    console.info(`找到 ${branchesToDelete.length} 个可清理的分支:`);
    branchesToDelete.forEach((branch) => console.info(`- ${branch}`));
  }

  if (listOnly) {
    return;
  }

  if (!silent) {
    const confirm = await new Promise((resolve) => {
      process.stdout.write("是否继续删除这些分支？(y/N) ");
      process.stdin.once("data", (data) => {
        resolve(data.toString().trim().toLowerCase() === "y");
      });
    });

    if (!confirm) {
      log("info", "操作已取消", options);
      return process.exit(1);
    }
  }

  let successCount = 0;
  let failCount = 0;

  for (const branch of branchesToDelete) {
    const success = await deleteBranch(branch, force);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  if (!silent) {
    console.info(`清理完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);
  }
};
