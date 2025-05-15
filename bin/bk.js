#!/usr/bin/env node

import { program } from "commander";
import { cleanBranches } from "../src/clean.js";
import { mergeToBranches } from "../src/merge.js";
import { fetchAllBranches } from "../src/fetch.js";
import { loadConfig } from "../src/config.js";

/**
 * 处理命令执行错误
 * @param {Error} error - 错误对象
 * @param {string} command - 命令名称
 */
const handleCommandError = (error, command) => {
  console.error(`❌ ${command} 命令执行失败:`, error.message);
  process.exit(1);
};

/**
 * 合并命令行选项和配置文件
 * @param {Object} cliOptions - 命令行选项
 * @param {Object} cliOptions.silent - 是否静默模式
 * @param {Object} cliOptions.remote - 远程仓库列表
 * @param {Object} cliOptions.ignore - 清理时忽略的分支列表
 * @param {Object} cliOptions.listOnly - 是否只列出要删除的分支
 * @param {Object} cliOptions.confirm - 是否确认清理
 * @param {Object} cliOptions.force - 是否强制删除
 * @param {Object} config - 配置文件
 * @param {string[]} config.protectedBranches - 受保护的分支列表
 * @param {string[]} config.remotes - 远程仓库列表
 * @param {boolean} config.silent - 是否静默模式
 * @param {string[]} config.ignore - 清理时要忽略的分支列表
 * @param {boolean} config.listOnly - 是否只列出要删除的分支
 * @param {boolean} config.confirm - 是否确认清理
 * @param {boolean} config.force - 是否强制删除
 * @param {boolean} config.ffOnly - 是否只允许快进合并
 * @param {string[]} config.mergeIgnore - 合并时要忽略的分支列表
 * @param {string[]} config.fetchIgnore - 拉取时要忽略的分支列表
 * @param {boolean} config.fetchForce - 是否强制更新
 * @param {boolean} config.debug - 是否打印调试日志
 * @returns {Object} 合并后的选项
 */
const mergeOptions = (cliOptions, config) => {
  return {
    silent: cliOptions.silent ?? config.silent ?? false,
    remotes: cliOptions.remote || config.remotes || [],
    ignore: [...(cliOptions.ignore || []), ...(config.ignore || [])],
    listOnly: cliOptions.listOnly ?? config.listOnly ?? false,
    confirm: cliOptions.confirm ?? config.confirm ?? true,
    force: cliOptions.force ?? config.force ?? false,
    protectedBranches: [...(config.protectedBranches || [])],
    debug: cliOptions.debug ?? config.debug ?? false,
  };
};

// 设置 CLI 程序
program.name("bk").description("Git 分支管理工具").version("1.0.0");

// Clean 命令
program
  .command("clean")
  .description("删除远程已不存在的本地分支")
  .option("-r, --remote <remotes...>", "指定要检查的远程仓库")
  .option("-i, --ignore <branches...>", "指定要忽略的分支")
  .option("--no-confirm", "删除前不进行确认")
  .option("--list-only", "仅列出要删除的分支，不执行删除")
  .option("--force", "强制删除，不需要确认")
  .option("--silent", "静默模式运行")
  .option("--debug", "打印调试日志")
  .action(async (options) => {
    try {
      const config = loadConfig(options);
      const finalOptions = mergeOptions(options, config);
      await cleanBranches(finalOptions);
    } catch (error) {
      handleCommandError(error, "clean");
    }
  });

// Merge 命令
program
  .command("merge")
  .description("将源分支的更改合并到一个或多个本地分支")
  .requiredOption("--source <branch>", "源分支名称")
  .option("--target <branches...>", "目标分支列表", [])
  .option("--exclude <branches...>", "要排除的分支列表", [])
  .option("--no-ff", "禁用快进合并")
  .option("--debug", "打印调试日志")
  .action(async (options) => {
    try {
      const config = loadConfig(options);
      const finalOptions = {
        ...options,
        ffOnly: options.ff ?? config.ffOnly ?? true,
        debug: options.debug ?? config.debug ?? false,
      };
      await mergeToBranches(finalOptions);
    } catch (error) {
      handleCommandError(error, "merge");
    }
  });

// Fetch 命令
program
  .command("fetch")
  .description("拉取所有远程分支并创建本地跟踪分支")
  .option("--remote <name>", "远程仓库名称 (默认: origin)", "origin")
  .option("--ignore <branches...>", "拉取时要忽略的分支", [])
  .option("--force", "强制更新已存在的本地分支")
  .option("--debug", "打印调试日志")
  .action(async (options) => {
    try {
      const config = loadConfig(options);
      const finalOptions = {
        ...options,
        force: options.force ?? config.force ?? false,
        debug: options.debug ?? config.debug ?? false,
      };
      await fetchAllBranches(finalOptions);
    } catch (error) {
      handleCommandError(error, "fetch");
    }
  });

// 添加帮助信息
program.addHelpText(
  "after",
  `
示例:
  $ bk clean --remote origin --ignore main develop
  $ bk merge --source feature --target main develop
  $ bk fetch --remote origin --ignore main
  `
);

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供命令，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
