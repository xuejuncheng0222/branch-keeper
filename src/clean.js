/**
 * 分支清理模块
 * 用于清理本地已合并但远程已删除的分支
 */

import {
  execGitCommand,
  getCurrentBranch,
  isProtectedBranch,
  log,
  checkWorkingDirectory,
  deleteBranch,
  updateRemoteBranch,
} from "./utils.js";

import ora from "ora";

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
  const spinner = ora({ text: "正在处理...", discardStdin: false }).start();
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

  /** 统计所有 remote */
  const remotesSet = new Set(
    trackingBranches.map(([_, upstream]) => upstream.split("/")[0])
  );
  /** 批量获取所有远程分支列表 */
  const remoteBranchMap = new Map();
  for (const remote of remotesSet) {
    try {
      const { stdout } = await execGitCommand(
        `git ls-remote --heads ${remote}`
      );
      const branchSet = new Set(
        stdout
          .split("\n")
          .map((line) => line.split("\t")[1]?.replace("refs/heads/", ""))
          .filter(Boolean)
      );
      remoteBranchMap.set(remote, branchSet);
    } catch (error) {
      console.error(`获取远程 ${remote} 分支列表失败: ${error.message}`);
      remoteBranchMap.set(remote, new Set());
    }
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
    // 优化：直接查 Map
    const branchSet = remoteBranchMap.get(remote);
    const exists = branchSet && branchSet.has(remoteBranch);
    // 不存在则加入删除列表
    if (!exists) {
      branchesToDelete.push(branch);
    }
  }

  if (branchesToDelete.length === 0) {
    spinner.text = "";
    spinner.stop();
    console.info("没有需要清理的分支");
    return;
  }

  if (!silent) {
    spinner.text = "";
    spinner.stop();
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
      return process.exit(0);
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
    updateRemoteBranch(silent, options);
    console.info(`清理完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);
  }
  process.exit(0);
};
