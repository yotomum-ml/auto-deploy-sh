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
auto-deploy <config-path>
# 或
auto-deploy -f <config-path>
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
- `BindPorts`: **端口映射**，格式为`<宿主机端口>:<容器内端口>` (e.g., `"8080:80"`)
- `Options`: 下面所列的所有属性都是**可选**，即可不添加属性
  - `volumes`: 用于设置**卷映射**，格式为`[宿主机路径/命名卷]:[容器内路径]:[可选权限标志]`的字符数组 (e.g., `["/host/data:/container/data:ro"]`)
  - `networks`: 用于**连接容器内自建网络**，用于本地容器间的通信，值为 `docker network create <network-name>` 创建的网络名

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
  "Options": {
    "volumes": "string[]",
    "networks": "string"
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
  "Options": {
    "volumes": ["/host/logs:/app/logs:rw"],
    "networks": "my-custom-network"
  }
}
```
