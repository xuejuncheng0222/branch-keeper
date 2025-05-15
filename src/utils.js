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
 * 检查分支是否存在
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
export const hasUnpushedCommits = async (branch) => {
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
 * @param {string} level - 日志级别
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
