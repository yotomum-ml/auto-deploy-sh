# Auto-deploy-sh

English|[简体中文](README_zh_CN.md)

Cloud service deployment is a crucial aspect of project engineering development and an important way to reach more users with applications. Currently, there are various methods for running projects on the cloud, among which **containerized deployment** has become the mainstream method for delivering cloud-native applications. The technology stack represented by **Docker + Kubernetes** can effectively address core issues such as **environment consistency, resource utilization, and portability** in the software development and deployment process ([Docker Official Documentation](https://docs.docker.com/)).

In enterprise-level development, project deployment often relies on tools such as GitLab to establish a comprehensive **CI/CD** (Continuous Integration/Continuous Delivery) workflow. However, for individual developers or small teams, setting up and maintaining a complete CI/CD system is not only complex but also costly, making it difficult to implement quickly.

So, how can individuals or small teams efficiently deploy projects? A common practice nowadays is to directly integrate Docker for deployment through an IDE (such as IntelliJ IDEA). However, this approach typically relies on **paid IDE versions**, requires cumbersome local configuration, and demands the installation of Docker CLI in the development environment, imposing certain technical thresholds and hardware and software requirements on users.

This project aims to **reduce the deployment threshold**, achieve an automated Docker deployment process with **minimal configuration and minimal dependencies**, and help developers quickly deploy applications to cloud servers without requiring complex environments.

## Explanation of configuration file attributes

The configuration file name is fixed as `deploy-config.json` and stored in the root directory. Since it contains private information, if added manually, please add it to `.gitignore`.
If the file is absent, the `CLI` will guide the addition process and update the content of `.gitignore` under the added location, requiring no additional operations.

```javaScript
{
  input: 'Remote server IP or domain name',
  port: 'SSH port',
  user： 'Username',
  password: 'password',
  beforLaunch：[ // Preparation operations before project release
    'npm run build'
  ],
  dockerBuildFiles: [
    // The files involved in the construction, relative to the path where the script runs (usually the root directory of the project)
    'Dockerfile',
    'dist'
  ],
  // Format: [Warehouse Address/] [Username/Project Name]: [Label]
  imageTag: 'Mirror identification',
  containerName: 'Container Name', // Unique identifier of Docker running instance
  BindPorts: 'Port Mapping' // Format: `<Host Port>:<Container Port>`
}
```

## Package release

### Partial configuration of the project

Download: `npm install auto-deploy-sh -D `
Run:

- package.json configuration

```json
"scripts": {
  "deploy": "auto-deploy-sh"
}
```

- Console running

```bash
npm run deploy
```

### Global Configuration

Download: `npm install auto-deploy-sh -g`
Run in the root directory of the project that needs to be deployed: `auto-deploy-sh`
