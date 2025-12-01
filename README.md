# Auto-deploy-sh

English|[简体中文](README_zh_CN.md)

This project aims to lower deployment barriers by providing an ultra-simple configuration and minimal dependency automated Docker deployment workflow. It helps developers quickly deploy applications to cloud servers without complex environment setups.

## Deployment Commands

### Project-Specific Configuration

**Install:**

```bash
npm install auto-deploy-sh -D
```

**Run:**

- Add to `package.json`:

```json
"scripts": {
  "deploy": "auto-deploy-sh"
}
```

2. Execute in terminal:

```bash
npm run deploy
```

### Global Configuration

**Install:**

```bash
npm install auto-deploy-sh -g
```

**Run** (in the root directory of the project to deploy):

```bash
auto-deploy-sh
```

### Advanced Usage

Run with a **custom configuration file**:

```bash
auto-deploy <config-path>
# OR
auto-deploy -f <config-path>
```

Useful for multi-environment deployment (e.g., development, staging, production).

## Configuration File Reference

The configuration file is **fixed as `deploy-config.json`**. If missing, the tool will **guide you to create it** (stored in the command execution directory by default) and automatically add `deploy-config.json` to `.gitignore` to **prevent accidental commits of sensitive data**.

> ⚠️ **Critical Note**: The configuration file contains sensitive information (e.g., passwords). If creating manually, ensure `deploy-config.json` is added to `.gitignore`.

### Configuration Properties

- `host`: Remote server IP address or domain name.
- `port`: SSH port number.
- `user`: SSH username for the remote server.
- `password`: Password for the SSH user.
- `beforLaunch`: **Pre-deployment commands** (array of strings) to execute locally before starting the deployment (e.g., `["npm run build"]`).
- `Dockerfile`: **Optional**. If omitted: 1. Check `dockerBuildFiles` for a file named `Dockerfile`; 2. If not found, search for `Dockerfile` in the **first-level directory of the current execution environment**.
- `dockerBuildFiles`: Files/directories to include in the Docker build context (required for Dockerfile execution).
- `imageTag`: Docker image tag, formatted as `[registry-url/][username/project-name]:[tag]` (e.g., `my-registry.com/user/my-app:v1.0`).
- `containerName`: Unique name for the running container (ensures no conflicts with existing containers).
- `BindPorts`: Port mapping, formatted as `<host-port>:<container-port>` (e.g., `"8080:80"`).
- `Options`: **Optional** advanced settings (all sub-properties are optional)
  - `volumes`: Volume mappings (array of strings), formatted as `[host-path/volume-name]:[container-path]:[optional-flags]` (e.g., `["/host/data:/container/data:ro"]`).
  - `networks`: Connect the container to a custom Docker network (created via `docker network create <network-name>`) for inter-container communication.

### Format Introduction

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

### Full Configuration Example

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
