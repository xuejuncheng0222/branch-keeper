/**
 * 配置文件管理模块
 * 用于加载和验证配置文件
 */

import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";

// 默认配置
const DEFAULT_CONFIG = {
  protectedBranches: ["main", "master", "develop"], // 受保护的分支
  remotes: ["origin"], // 要检查的远程仓库列表

  silent: false, // 是否静默模式
  ignore: [], // 清理时要忽略的分支
  listOnly: false, // 是否只列出要清理的分支
  confirm: true, // 是否确认清理
  force: false, // 是否强制清理

  ffOnly: true, // 是否只允许快进合并
  mergeIgnore: [], // 合并时要忽略的分支

  fetchIgnore: [], // 拉取时要忽略的分支
  fetchForce: false, // 是否强制更新
};

/**
 * 验证配置对象
 * @param {Object} config - 配置对象
 * @returns {Object} 验证后的配置对象
 */
const validateConfig = (config) => {
  if (!config || typeof config !== "object") {
    return DEFAULT_CONFIG;
  }

  // 合并默认配置
  const mergedConfig = {
    branch: { ...DEFAULT_CONFIG.branch, ...config.branch },
    remote: { ...DEFAULT_CONFIG.remote, ...config.remote },
    clean: { ...DEFAULT_CONFIG.clean, ...config.clean },
    merge: { ...DEFAULT_CONFIG.merge, ...config.merge },
    fetch: { ...DEFAULT_CONFIG.fetch, ...config.fetch },
  };

  // 验证必要的配置项
  if (!mergedConfig.branch.main) {
    console.warn("警告: 未指定主分支名称，使用默认值 'main'");
  }

  if (!mergedConfig.remote.name) {
    console.warn("警告: 未指定远程仓库名称，使用默认值 'origin'");
  }
  console.log("加载正确配置", mergedConfig);

  return mergedConfig;
};

/**
 * 加载配置文件
 * @param {string} [customFile] - 可选，自定义配置文件名
 * @returns {Object} 配置对象
 */
const loadConfig = (customFile) => {
  const configFiles = customFile
    ? [customFile]
    : [
        ".branchkeeperrc.json",
        ".branchkeeperrc.yaml",
        ".branchkeeperrc.yml",
        ".branchkeeperrc",
      ];

  for (const file of configFiles) {
    try {
      const filePath = path.resolve(process.cwd(), file);

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        let config;

        if (file.endsWith(".yaml") || file.endsWith(".yml")) {
          config = yaml.load(content);
        } else {
          config = JSON.parse(content);
        }
        console.info("提示: 加载配置文件", file);
        // 验证并返回配置
        return validateConfig(config);
      }
    } catch (error) {
      console.warn(`警告: 加载配置文件 ${file} 失败:`, error.message);
      continue;
    }
  }

  console.info("提示: 未找到配置文件，使用默认配置");
  return DEFAULT_CONFIG;
};

export { loadConfig, DEFAULT_CONFIG };
