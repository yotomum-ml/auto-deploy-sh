# Auto-deploy-sh

简体中文|[English](README.md)

云服务部署是项目工程化开发的关键环节，也是让应用触达更多用户的重要途径。当前，云上运行项目的方式多种多样，其中**容器化部署**已成为主流的云原生应用交付方式，以 **Docker + Kubernetes** 为代表的技术栈，能够有效解决软件开发与部署过程中的**环境一致性、资源利用率和可移植性**等核心问题（[Docker 官方文档](https://docs.docker.com/)）。

在企业级开发中，项目上线通常依赖 GitLab 等工具构建完整的 **CI/CD**（持续集成/持续交付）流程。然而，对于个人开发者或小型团队而言，搭建和维护一套完整的 CI/CD 系统不仅复杂，而且成本较高，难以快速落地。

那么，个人或小团队如何高效地实现项目部署？目前常见的做法是通过 IDE（如 IntelliJ IDEA）直接集成 Docker 进行部署。但这种方式通常依赖**付费版 IDE**，需要繁琐的本地配置，且要求开发环境安装 Docker CLI，对使用者的技术门槛和软硬件条件有一定要求。

本项目旨在**降低部署门槛**，实现**极简配置、最少依赖**的自动化 Docker 部署流程，帮助开发者无需复杂环境即可快速将应用部署到云服务器。

## 配置文件属性讲解

配置文件名固定为`deploy-config.json`，存放在根目录下，里面涉及隐私内容，如果是手动添加，请在`.gitignore`中添加。
若无该文件，该`CLI`会引导添加，并在添加位置下的`.gitignore`内容，无须而外操作。

```javaScript
{
  input: '远程服务器 IP 或域名',
  port: 'SSH 端口',
  user： '用户名',
  password: '密码',
  beforLaunch：[ // 项目发布前的准备操作
    'npm run build'
  ],
  dockerBuildFiles: [ // 参与构建的文件，相对于运行脚本的路径(一般为项目的根目录)
    'Dockerfile',
    'dist'
  ],
  imageTag: '镜像标识', // 格式为[仓库地址/][用户名/项目名]:[标签]
  containerName: '容器名', // docker 运行实例的唯一标识
  BindPorts: '端口映射' // 格式为：`<宿主机端口>:<容器内端口>`
}
```

## 打包发布

### 项目局部配置

下载：`npm install auto-deploy-sh -D `
运行：

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

下载：`npm install auto-deploy-sh -g`
在需要部署的项目根目录下运行: `auto-deploy-sh`
