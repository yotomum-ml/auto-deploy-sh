# Auto-deploy-sh

简体中文|[English](README.md)

本项目旨在**降低部署门槛**，实现**极简配置、最少依赖**的自动化 Docker 部署流程，帮助开发者无需复杂环境即可快速将应用部署到云服务器。

## 发布命令

### 项目局部配置

#### 下载

`npm install auto-deploy-sh -D `

#### 运行

- package.json 配置

```json
"scripts": {
  "deploy": "auto-deploy-sh"
}
```

- 控制台运行

```bash
npm run deploy
```

### 全局配置

**下载：**

```bash
npm install auto-deploy-sh -g
```

**在需要部署的项目根目录下运行：**

```bash
auto-deploy-sh
```

### 进阶

运行**指定配置文件**：

```bash
auto-deploy-sh <config-path>
# 或
auto-deploy-sh -f <config-path>
```

用于适配不同环境的部署，常见的划分为开发环境、预发环境、线上环境。

## 配置文件属性讲解

配置文件名固定为`deploy-config.json`，**若无该文件，会引导添加**（默认存放在运行命令的目录下），并在`.gitignore`中添加`deploy-config.json`，**避免部署配置文件提交**。

> ⚠️ **关键提示**：配置文件包含敏感信息（例如密码）。如果手动创建，请确保将`deploy-config.json`添加到`.gitignore`中。

### 相关属性讲解

- `host`: 远程服务器 IP 或域名
- `port`: SSH 端口
- `user`: 用户名
- `password`: 密码
- `beforLaunch`: 项目**发布前的准备操作**，即需要在控制台执行的命令 (e.g., `["npm run build"]`)
- `Dockerfile`: **可选**，如不填，**则在 dockerBuildFiles 配置内寻找是否具有名称为 Dockerfile 的文件**，若未找到，默认查找**当前运行环境目录下的第一层目录中是否存在 Dockerfile 文件**
- `dockerBuildFiles`: **参与构建的文件**，需要打包进 docker 容器内的文件，即 Dockerfile 执行所涉及的上下文
- `imageTag`: **镜像标识**，格式为`[仓库地址][用户名/项目名]:[标签]` (e.g., `my-registry.com/user/my-app:v1.0`)
- `containerName`: **容器名**，运行实例的唯一标识
- `BindPorts`（**可选**）: **端口映射**，格式为`<宿主机端口>:<容器内端口>` (e.g., `"8080:80"`)
- `restart`（**可选**）: **容器重启机制**，有以下四个选项：
  - `no`（默认）: 容器**退出后不会自动重启**。当 Docker 服务或系统重启时，容器也不会自动启动，适用于一次性任务或调试场景。
  - `always`: 容器一旦停止就会**始终自动重启**。在 Docker 服务或系统重启后，容器会自动启动。即使容器被手动停止，在 Docker 重启后仍会被再次拉起。
  - `unless-stopped`（推荐）: 当容器异常退出时会自动重启，并在 Docker 服务或系统重启后自动启动；如果容器被用户手动停止，则不会再次自动启动，**适合长期运行的生产服务**。
  - `on-failure`: **仅当容器以非 0 状态码退出**时才会自动重启，正常退出（exit code 为 0）不会重启。
- `Options`: 下面所列的所有属性都是**可选**，即可不添加属性
  - `volumes`: 用于设置**卷映射**，格式为`[宿主机路径/命名卷]:[容器内路径]:[可选权限标志]`的字符数组 (e.g., `["/host/data:/container/data:ro"]`)
  - `networks`: 用于**连接容器内自建网络**，用于本地容器间的通信，值为 `docker network create <network-name>` 创建的网络名
  - `logging`: 用于设置**容器日志管理**，部署时会转换为 Docker 的 `--log-driver` 和 `--log-opt` 参数。部署前会读取远程 Docker 支持的日志驱动，如果配置的 `driver` 不在远程 Docker 支持列表中，将终止部署并提示当前默认驱动和支持的驱动列表。
    - `driver`: 日志驱动，当前引导支持 `json-file`、`local`、`none`、`syslog`、`journald`、`gelf`、`fluentd`、`awslogs`、`splunk`、`gcplogs`。
    - `options`: 日志驱动参数，会按 `--log-opt key=value` 传递给 `docker run`。
    - `options.max-size`: 单个日志文件的最大大小，默认引导值为 `10m`。
    - `options.max-file`: 保留的日志文件数量，默认引导值为 `3`。
    - `options.compress`: 是否启用日志压缩，当前引导在选择 `json-file` 时会询问该配置。

### 格式介绍

```json
{
  "host": "string",
  "port": "number | string",
  "user": "string",
  "password": "string",
  "beforLaunch": "string[]",
  "Dockerfile": "string",
  "dockerBuildFiles": "string[]",
  "imageTag": "string",
  "containerName": "string",
  "BindPorts": "string",
  "restart": "'no' | 'always' | 'unless-stopped' | 'on-failure'",
  "Options": {
    "volumes": "string[]",
    "networks": "string[]",
    "logging": {
      "driver": "'json-file' | 'local' | 'none' | 'syslog' | 'journald' | 'gelf' | 'fluentd' | 'awslogs' | 'splunk' | 'gcplogs'",
      "options": {
        "max-size": "string",
        "max-file": "string",
        "compress": "boolean"
      }
    }
  }
}
```

### 完整配置例子

```json
{
  "host": "your-server-ip",
  "port": 22,
  "user": "ssh-username",
  "password": "ssh-password",
  "beforLaunch": ["npm run build"],
  "Dockerfile": "./Dockerfile",
  "dockerBuildFiles": ["./dist", "./package.json"],
  "imageTag": "my-app:latest",
  "containerName": "my-app-container",
  "BindPorts": "80:80",
  "restart": "unless-stopped",
  "Options": {
    "volumes": ["/host/logs:/app/logs:rw"],
    "networks": ["my-custom-network", "my-custom-network-1"],
    "logging": {
      "driver": "json-file",
      "options": {
        "max-size": "10m",
        "max-file": "3",
        "compress": true
      }
    }
  }
}
```
