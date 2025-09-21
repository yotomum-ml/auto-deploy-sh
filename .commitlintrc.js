/**
 * git 提交前缀说明：
 * style: 样式修改  fix: bug修复  feat: 功能开发  refactor: 代码重构
 * test: 测试类修改  doc: 文档更新  conf: 配置修改  merge: 代码合并
 * perf: 优化相关  revert: 回滚到上一个版本
 * 标准提交格式
 * <type>[optional scope]: <subject>
 * [optional body]
 * [optional footer]
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'style',
      'fix',
      'feat',
      'refactor',
      'test',
      'doc',
      'conf',
      'merge',
      'perf',
      'revert'
    ]],
    'type-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 50],
    'body-empty': [0],
    'body-max-length': [2, 'always', 100],
    'body-leading-blank': [2, 'never'],
    'footer-empty': [0],
    'footer-leading-blank': [2, 'never'],
    'footer-max-length': [2, 'always', 50],
    'scope-empty': [0],
    'scope-max-length': [2, 'always', 10],
    'signed-off-by': [0]
  }
}