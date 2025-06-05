# Git 工具函数说明文档

## 目录
- [Git 命令执行](#git-命令执行)
  - [执行 Git 命令并返回结果](#执行-git-命令并返回结果)
- [仓库状态检查](#仓库状态检查)
  - [检查当前目录是否是 Git 仓库](#检查当前目录是否是-git-仓库)
  - [获取当前所在分支名称](#获取当前所在分支名称)
  - [检查工作区是否有未提交的更改](#检查工作区是否有未提交的更改)
  - [检查分支是否有未推送的提交](#检查分支是否有未推送的提交)
  - [检查工作目录状态](#检查工作目录状态)
- [分支操作](#分支操作)
  - [检查指定分支是否存在](#检查指定分支是否存在)
  - [获取所有本地分支列表](#获取所有本地分支列表)
  - [删除指定分支](#删除指定分支)
  - [更新远程分支信息](#更新远程分支信息)
  - [切换分支](#切换分支)
- [暂存操作](#暂存操作)
  - [暂存工作区更改](#暂存工作区更改)
  - [恢复暂存的更改](#恢复暂存的更改)
  - [获取暂存列表](#获取暂存列表)
- [分支保护](#分支保护)
  - [检查分支是否是保护分支](#检查分支是否是保护分支)
- [日志输出](#日志输出)
  - [格式化日志输出](#格式化日志输出)

## Git 命令执行

### 执行 Git 命令并返回结果

#### execGitCommand
执行 Git 命令并返回结果。

```javascript
const result = await execGitCommand("git status");
```

**参数：**
- `command` (string): Git 命令字符串

**返回：**
- `Promise<{stdout: string, stderr: string}>`: 命令执行结果

**示例：**
```javascript
try {
  const { stdout } = await execGitCommand("git status");
  console.log(stdout);
} catch (error) {
  console.error("命令执行失败:", error);
}
```

## 仓库状态检查

### 检查当前目录是否是 Git 仓库

#### isGitRepository
检查当前目录是否是 Git 仓库。

```javascript
const isRepo = await isGitRepository();
```

**返回：**
- `Promise<boolean>`: 是否是 Git 仓库

**使用场景：**
- 在执行任何 Git 操作前检查环境
- 确保当前目录是有效的 Git 仓库

### 获取当前所在分支名称

#### getCurrentBranch
获取当前所在分支名称。

```javascript
const currentBranch = await getCurrentBranch();
```

**返回：**
- `Promise<string>`: 当前分支名称

**使用场景：**
- 需要知道当前所在分支时
- 在切换分支前检查当前分支

### 检查工作区是否有未提交的更改

#### hasUncommittedChanges
检查工作区是否有未提交的更改。

```javascript
const hasChanges = await hasUncommittedChanges();
```

**返回：**
- `Promise<boolean>`: 是否有未提交的更改

**使用场景：**
- 在执行合并操作前检查工作区状态
- 确保没有未保存的更改

### 检查分支是否有未推送的提交

#### hasNotPushedCommits
检查指定分支是否有未推送到远程的提交。

```javascript
const hasUnpushed = await hasNotPushedCommits("feature-branch");
```

**参数：**
- `branch` (string): 分支名称

**返回：**
- `Promise<boolean>`: 是否有未推送的提交

**使用场景：**
- 在删除分支前检查是否有未推送的提交
- 确保分支的更改已经同步到远程

### 检查工作目录状态

#### checkWorkingDirectory
检查工作目录状态。

```javascript
const canProceed = await checkWorkingDirectory(true);
```

**参数：**
- `checkCommit` (boolean): 是否检查未提交的更改，默认为 false

**返回：**
- `Promise<boolean>`: 是否可以继续操作

**使用场景：**
- 在执行重要操作前检查工作区状态
- 确保工作区干净，可以安全操作

## 分支操作

### 检查指定分支是否存在

#### branchExists
检查指定分支是否存在。

```javascript
const exists = await branchExists("feature-branch");
```

**参数：**
- `branch` (string): 分支名称

**返回：**
- `Promise<boolean>`: 分支是否存在

**使用场景：**
- 在删除分支前确认分支存在
- 在切换分支前检查目标分支

### 获取所有本地分支列表

#### getLocalBranches
获取所有本地分支列表。

```javascript
const branches = await getLocalBranches();
```

**返回：**
- `Promise<string[]>`: 本地分支列表

**使用场景：**
- 显示所有本地分支
- 在删除分支前获取分支列表

### 删除指定分支

#### deleteBranch
删除指定分支。

```javascript
const success = await deleteBranch("feature-branch", true);
```

**参数：**
- `branch` (string): 要删除的分支名称
- `force` (boolean): 是否强制删除，默认为 false

**返回：**
- `Promise<boolean>`: 是否删除成功

**使用场景：**
- 删除已合并的分支
- 强制删除未合并的分支

### 更新远程分支信息

#### updateRemoteBranch
更新远程分支信息。

```javascript
await updateRemoteBranch(false, { debug: true });
```

**参数：**
- `silent` (boolean): 是否静默模式
- `options` (object): 配置选项，如 debug

**使用场景：**
- 在获取远程分支前更新信息
- 清理过时的远程分支引用

### 切换分支

#### checkoutBranch
切换到指定分支。

```javascript
const success = await checkoutBranch("feature-branch", options, false);
```

**参数：**
- `branch` (string): 目标分支名称
- `options` (object): 配置选项
  - `debug` (boolean): 是否开启调试日志
- `force` (boolean): 是否强制切换（丢弃本地修改），默认为 false

**返回：**
- `Promise<boolean>`: 是否切换成功

**使用场景：**
- 切换到其他分支
- 在切换分支前处理工作区更改

## 暂存操作

### 暂存工作区更改

#### stashChanges
暂存当前工作区的更改。

```javascript
const success = await stashChanges("暂存信息", { debug: true });
```

**参数：**
- `message` (string): 暂存信息，可选
- `options` (object): 配置选项
  - `debug` (boolean): 是否开启调试日志

**返回：**
- `Promise<boolean>`: 是否暂存成功

**使用场景：**
- 临时保存工作区更改
- 在切换分支前暂存未提交的更改

### 恢复暂存的更改

#### popStash
恢复最近一次暂存的更改。

```javascript
const success = await popStash({ debug: true });
```

**参数：**
- `options` (object): 配置选项
  - `debug` (boolean): 是否开启调试日志

**返回：**
- `Promise<boolean>`: 是否恢复成功

**使用场景：**
- 恢复之前暂存的更改
- 在切换分支后恢复工作区状态

### 获取暂存列表

#### getStashList
获取所有暂存的列表。

```javascript
const stashList = await getStashList();
```

**返回：**
- `Promise<Array<{index: number, message: string}>>`: 暂存列表

**使用场景：**
- 查看所有暂存的更改
- 管理多个暂存记录

## 分支保护

### 检查分支是否是保护分支

#### isProtectedBranch
检查指定分支是否是保护分支。

```javascript
const isProtected = isProtectedBranch("main", ["main", "develop"]);
```

**参数：**
- `branch` (string): 分支名称
- `protectedBranches` (string[]): 保护分支列表

**返回：**
- `boolean`: 是否是保护分支

**使用场景：**
- 在删除分支前检查是否是保护分支
- 防止误删重要分支

## 日志输出

### 格式化日志输出

#### log
格式化日志输出。

```javascript
log("info", "操作成功", { debug: true });
```

**参数：**
- `level` (string): 日志级别（error/warn/info/debug）
- `message` (string): 日志消息
- `options` (object): 日志选项，如 debug
- `...args` (any): 额外参数

**使用场景：**
- 统一输出日志信息
- 控制日志级别和格式

**日志级别说明：**
- `error`: 错误信息，总是显示
- `warn`: 警告信息，总是显示
- `info`: 普通信息，受 debug 选项控制
- `debug`: 调试信息，受 debug 选项控制 