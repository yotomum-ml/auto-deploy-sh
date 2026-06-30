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
auto-deploy-sh <config-path>
# OR
auto-deploy-sh -f <config-path>
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
- `BindPorts` (optional): Port mapping, formatted as `<host-port>:<container-port>` (e.g., `"8080:80"`).
- `restart` (optional): Container restart policy, controls how Docker handles container restarts. The following options are supported:
  - `no`(default): The container **will not restart automatically after it exits**. It will also remain stopped after Docker or system restarts. Suitable for one-off tasks or debugging scenarios.
  - `always`: The container **will always restart automatically** if it stops. It will also start automatically after Docker or system restarts.Even if the container is manually stopped, it will be restarted again after Docker restarts.
  - `unless-stopped`(recommended): The container will automatically restart on failure and start after Docker or system restarts.**If the container is manually stopped, it will not be restarted again**, making it suitable for long-running production services.
  - `on-failure`: The container **will restart only if it exits with a non-zero status code**. It will not restart on normal exits (exit code 0).
- `Options`: **Optional** advanced settings (all sub-properties are optional)
  - `volumes`: Volume mappings (array of strings), formatted as `[host-path/volume-name]:[container-path]:[optional-flags]` (e.g., `["/host/data:/container/data:ro"]`).
  - `networks`: Connect the container to a custom Docker network (created via `docker network create <network-name>`) for inter-container communication.
  - `logging`: Docker log management configuration. During deployment, it is converted to Docker `--log-driver` and `--log-opt` arguments. Before starting the container, the tool checks the logging drivers supported by the remote Docker daemon. If the configured `driver` is not supported, deployment stops and prints the current default driver and supported driver list.
    - `driver`: Logging driver. The interactive guide currently supports `json-file`, `local`, `none`, `syslog`, `journald`, `gelf`, `fluentd`, `awslogs`, `splunk`, and `gcplogs`.
    - `options`: Logging driver options passed to `docker run` as `--log-opt key=value`.
    - `options.max-size`: Maximum size of a single log file. The guided default is `10m`.
    - `options.max-file`: Number of rotated log files to keep. The guided default is `3`.
    - `options.compress`: Whether to enable log compression. The interactive guide asks for this option when `json-file` is selected.

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
