/**
 * 工具函数模块
 * 提供共享的工具函数
 */

import { exec } from "child_process";
import { promisify } from "util";

/**
 * 执行 Git 命令
 * @param {string} command - Git 命令
 * @returns {Promise<{stdout: string, stderr: string}>} 命令执行结果
 * @throws {Error} 命令执行失败时抛出错误
 */
const execAsync = promisify(exec);

/**
 * 执行 Git 命令
 * @param {string} command - Git 命令
 * @returns {Promise<{stdout: string, stderr: string}>} 命令执行结果
 * @throws {Error} 命令执行失败时抛出错误
 */
export const execGitCommand = async (command) => {
  try {
    const result = await execAsync(command);
    return result;
  } catch (error) {
    console.error(`执行命令失败: ${command}`);
    console.error(`错误信息: ${error.message}`);
    throw error;
  }
};

/**
 * 检查是否是 Git 仓库
 * @returns {Promise<boolean>} 是否是 Git 仓库
 */
export const isGitRepository = async () => {
  try {
    // 判断当前文件是否是git地址
    await execGitCommand("git rev-parse --is-inside-work-tree");
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 获取当前分支名称
 * @returns {Promise<string>} 当前分支名称
 */
export const getCurrentBranch = async () => {
  try {
    // 获取当前分支名
    const { stdout } = await execGitCommand("git rev-parse --abbrev-ref HEAD");
    return stdout.trim();
  } catch (error) {
    console.error("获取当前分支失败");
    return "";
  }
};

/**
 * 检查本地分支是否存在
 * @param {string} branch - 分支名称
 * @returns {Promise<boolean>} 分支是否存在
 */
export const branchExists = async (branch) => {
  try {
    await execGitCommand(`git show-ref --verify --quiet refs/heads/${branch}`);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 检查是否有未提交的更改
 * @returns {Promise<boolean>} 是否有未提交的更改
 */
export const hasUncommittedChanges = async () => {
  try {
    // 会把工作区的改动显露出来 eg: M README.md
    const { stdout } = await execGitCommand("git status --porcelain");
    return stdout.trim().length > 0;
  } catch (error) {
    console.error("检查工作区状态失败");
    return true; // 出错时返回 true 以保护工作区
  }
};

/**
 * 检查是否有未推送的提交
 * @param {string} branch - 分支名称
 * @returns {Promise<boolean>} 是否有未推送的提交
 */
export const hasNotPushedCommits = async (branch) => {
  try {
    const { stdout } = await execGitCommand(
      `git log ${branch} --not --remotes`
    );
    return stdout.trim().length > 0;
  } catch (error) {
    console.error(`检查分支 ${branch} 未推送提交失败`);
    return true; // 出错时返回 true 以保护分支
  }
};

/**
 * 检查分支是否是保护分支
 * @param {string} branch - 分支名
 * @param {string[]} protectedBranches - 保护分支列表
 * @returns {boolean} 是否是保护分支
 */
export const isProtectedBranch = (branch, protectedBranches) => {
  return protectedBranches.includes(branch);
};

/**
 * 格式化日志输出
 * @param {info|error|warn} level - 日志级别
 * @param {string} message - 日志消息
 * @param {object} [options] - 日志选项（如 debug）
 * @param {...any} args - 额外参数
 */
export const log = (level, message, options = {}, ...args) => {
  // 只有 debug/info 日志受 debug 控制，error/warn 总是打印
  const alwaysPrint = ["error", "warn"];
  if (!alwaysPrint.includes(level.toLowerCase()) && options.debug !== true) {
    return;
  }
  const timestamp = new Date().toLocaleString();
  const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
  console.log(prefix, message, ...args);
};

/**
 * 检查工作目录状态 合并等操作需求工作区干净，删除分支的操作不需要
 * @param {boolean} checkCommit - 是否检查未提交的更改，默认false
 * @returns {Promise<boolean>} 是否可以继续操作
 */
export const checkWorkingDirectory = async (checkCommit = false) => {
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
export const getLocalBranches = async () => {
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
 * 删除分支
 * @param {string} branch - 分支名
 * @param {boolean} force - 是否强制删除
 * @returns {Promise<boolean>} 是否删除成功
 */
export const deleteBranch = async (branch, force = false) => {
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
 * 更新远程分支信息
 * @param {*} silent 是否静默模式
 * @param {*} options 参数 options.debug
 * @returns
 */
export const updateRemoteBranch = async (silent, options) => {
  // 先执行 git fetch -p 更新远程分支信息
  try {
    if (!silent) {
      log("info", "正在更新远程分支信息...", options);
    }
    await execGitCommand("git fetch -p");
    if (!silent) {
      log("info", "远程分支信息更新完成", options);
    }
  } catch (error) {
    log("error", `更新远程分支信息失败: ${error.message}`, options);
    return;
  }
};

/**
 * 切换分支
 * @param {string} branch - 目标分支名
 * @param {Object} options - 配置
 * @param {boolean} options.debug 是否开启日志模式
 * @param {boolean} force - 是否强制切换（丢弃本地修改）
 * @returns {Promise<boolean>} 是否切换成功
 */
export const checkoutBranch = async (branch, options, force = false) => {
  try {
    // 检查是否有未提交的更改
    if (await hasUncommittedChanges()) {
      if (!force) {
        console.warn("工作区有未提交的更改，请先提交或暂存更改");
        return false;
      }
      // 强制切换时，先重置工作区
      await execGitCommand("git reset --hard");
    }

    // 执行切换分支命令
    await execGitCommand(`git checkout ${branch}`);
    return true;
  } catch (error) {
    log("error", `切换分支失败: ${error.message}`, options);
    return false;
  }
};

/**
 * 暂存当前工作区的更改
 * @param {string} message - 暂存信息
 * @param {Object} options - 配置选项
 * @param {boolean} options.debug - 是否打印调试日志
 * @returns {Promise<boolean>} 是否暂存成功
 */
export const stashChanges = async (message = "", options = {}) => {
  try {
    const command = message
      ? `git stash push -m "${message}"`
      : "git stash push";
    await execGitCommand(command);
    log("info", "成功暂存工作区更改", options);
    return true;
  } catch (error) {
    log("error", `暂存工作区更改失败: ${error.message}`, options);
    return false;
  }
};

/**
 * 恢复暂存的更改
 * @param {Object} options - 配置选项
 * @param {boolean} options.debug - 是否打印调试日志
 * @returns {Promise<boolean>} 是否恢复成功
 */
export const popStash = async (options = {}) => {
  try {
    await execGitCommand("git stash pop");
    log("info", "成功恢复暂存的更改", options);
    return true;
  } catch (error) {
    log("error", `恢复暂存的更改失败: ${error.message}`, options);
    return false;
  }
};

/**
 * 获取暂存列表
 * @returns {Promise<Array<{index: number, message: string}>>} 暂存列表
 */
export const getStashList = async () => {
  try {
    const { stdout } = await execGitCommand("git stash list --format='%gd %s'");
    return stdout
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [index, ...messageParts] = line.split(" ");
        return {
          index: parseInt(index.replace("stash@{", "").replace("}", "")),
          message: messageParts.join(" "),
        };
      });
  } catch (error) {
    log("error", "获取暂存列表失败");
    return [];
  }
};
