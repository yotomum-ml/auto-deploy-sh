#!/usr/bin/env bash

# 定义跨平台弹窗函数
# 参数1: 标题 (title)
# 参数2: 消息内容 (message)
show_error_notification() {
  local title="$1"
  local message="$2"
  node -e "
    const notifier = require('node-notifier');
    notifier.notify({
      title: '$title',
      message: '$message',
      sound: true
    });
  "
}
show_erro_msg() {
  local message="$1"
  echo -e "\e[33m$1\e[0m" >&2
}

# 导出函数以被子脚本调用
export -f show_error_notification
export -f show_erro_msg