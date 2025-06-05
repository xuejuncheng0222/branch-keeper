# Branch Keeper

一个现代化的 Git 分支管理工具，支持分支清理、合并、拉取等常用操作，提升团队协作效率。

## 安装

```bash
npm install -g branch-keeper
```

或在项目中本地安装：

```bash
npm install branch-keeper --save-dev
```

## 快速开始

全局安装后可直接使用 `bk` 命令：

```bash
bk --help
```

## 功能介绍

### 1. 清理本地分支（clean）

`bk clean` 用于**删除本地分支（远程已删除）** 的情况，支持多种参数灵活控制。例如：拉同时最新开发的代码查看，后来切到自己的分支，同事在开发完需求之后删除这个分支，但是我们本地还存在当时的分支，日积月累会造成我本地的废弃分支越来越多，需要一个一键删除的工具。

#### 基本用法

```bash
bk clean
```

#### 常用参数

- `-r, --remote <remotes...>`
  指定要检查的远程仓库，支持多个，默认 `origin`。
  例：`bk clean --remote origin upstream`

- `-i, --ignore <branches...>`
  指定要忽略的分支，支持多个。
  例：`bk clean --ignore main develop`

- `--no-confirm`
  删除前不进行确认，适合自动化脚本。

- `--list-only`
  仅列出将要被删除的分支，不实际删除。

- `--force`
  强制删除（可删除受保护分支），不需要确认。

- `--silent`
  静默模式运行，不输出日志。

- `--debug`
  打印调试日志，输出详细信息。

#### 示例

```bash
# 清理本地分支，忽略 main 和 develop，仅检查 origin 远程
bk clean --remote origin --ignore main develop

# 只列出将要被删除的分支，并输出调试信息
bk clean --list-only --debug

# 强制删除所有符合条件的分支，不做确认
bk clean --force --no-confirm
```

### 2. 选择删除（单个|多个）分支（delete）

`bk delete` 用于**交互式删除本地分支**，支持单选和多选模式。

#### 基本用法

```bash
bk delete
```

#### 常用参数

- `-m, --multi`
  启用多选模式，可以同时选择多个分支删除。

- `-f, --force`
  强制删除分支，不需要确认。

- `--debug`
  打印调试日志，输出详细信息。

#### 示例

```bash
# 启用多选模式删除分支
bk delete --multi

# 强制删除分支，不需要确认
bk delete --force
```

### 3. 切换分支（checkout）

`bk checkout` 用于**交互式切换分支**，提供友好的分支选择界面。

#### 基本用法

```bash
bk checkout
```

#### 常用参数

- `--debug`
  打印调试日志，输出详细信息。

#### 功能特点

- 显示当前所在分支
- 禁用当前分支选项
- 自动处理未提交的更改
  - 检测到未提交更改时，询问是否暂存
  - 支持暂存工作区更改
  - 切换分支后自动恢复暂存的更改
- 优雅处理 Ctrl+C 中断
- 显示切换进度

#### 示例

```bash
# 交互式切换分支
bk checkout

# 开启调试模式
bk checkout --debug
```

#### 配置文件支持

你可以在项目根目录添加 `.branchkeeperrc` `.branchkeeperrc.json` `.branchkeeperrc.yaml` `.branchkeeperrc.yml`文件，配置默认参数（如受保护分支、忽略分支等），命令行参数会覆盖配置文件。

#### 默认配置

```json
{
  "protectedBranches": ["main", "master", "develop"],
  "remotes": ["origin"],
  "silent": false,
  "ignore": [],
  "listOnly": false,
  "confirm": true,
  "force": false,
  "ffOnly": true,
  "mergeIgnore": [],
  "fetchIgnore": [],
  "fetchForce": false
}
```

---

## 其他命令

- `bk merge`：将源分支的更改合并到一个或多个本地分支
- `bk fetch`：拉取所有远程分支并创建本地跟踪分支

详细用法请通过 `bk <command> --help` 查看。

---

## 贡献与反馈

欢迎提 issue 或 PR 参与改进！