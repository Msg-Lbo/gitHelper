/**
 * OA 系统 Webview 注入样式
 * 简化版本 - 主要让登录控件居中显示
 */

/**
 * 样式压缩函数
 * 移除多余的空白字符以减少注入的CSS大小
 */
export const compressCSS = (css: string): string => {
  return css.replace(/\s+/g, ' ').trim()
}

/**
 * 简化的注入样式 - 登录控件居中 + 深色主题配色
 */
export const generateOAStyles = (): string => {
  return `
        /* 页面居中布局 */
        body {
          display: flex !important;
          justify-content: center !important;
        }

        /* 隐藏不必要的元素 */
        body > *:not(#app) { display: none !important; }
        .login .left { display: none !important; }
        .right .title { display: none !important; }
        .loginFooter { display: none !important; }
        .header, .footer, .sidebar { display: none !important; }

        /* 重置容器样式确保居中 */
        #app, .login, .loginContent, .signWrap {
          all: unset !important;
          display: block !important;
        }

        .right .titleWrap {
          display: none !important;
        }
       
        /* 输入框样式优化 */
        .right .el-input__inner {
          background: rgba(42, 42, 50, 0.8) !important;
          border: 1px solid rgba(64, 64, 70, 0.6) !important;
          color: #e8e8e8 !important;
          box-shadow: none !important;
          height: 48px !important;
          line-height: 48px !important;
          border-radius: 8px !important;
          padding: 0 16px !important;
          font-size: 14px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* 输入框占位符样式 */
        .right .el-input__inner::placeholder {
          color: rgba(194, 194, 194, 0.5) !important;
          font-size: 14px !important;
        }

        /* 输入框聚焦状态 */
        .right .el-input__inner:focus {
          border-color: #7FE7C4 !important;
          box-shadow: 0 0 0 3px rgba(127, 231, 196, 0.1) !important;
          background: rgba(42, 42, 50, 1) !important;
          transform: translateY(-1px) !important;
        }

        /* 输入框悬停状态 */
        .right .el-input__inner:hover {
          border-color: rgba(127, 231, 196, 0.4) !important;
          background: rgba(42, 42, 50, 0.9) !important;
        }

        /* 登录按钮美化 */
        .right .el-button--primary {
          background: linear-gradient(135deg, #7FE7C4 0%, #6DD5B8 100%) !important;
          border: none !important;
          border-radius: 8px !important;
          color: #1a1a1a !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          letter-spacing: 0.5px !important;
          cursor: pointer !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 4px 16px rgba(127, 231, 196, 0.3) !important;
        }

        /* 表单项间距 */
        .right .el-form-item {
          margin-bottom: 24px !important;
        }

        /* 验证码输入组样式 */
        .right .el-input-group__append {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }

        /* 验证码图片样式 */
        .right .code {
          height: 48px !important;
          line-height: 48px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(64, 64, 70, 0.6) !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }

        /* 按钮加载状态光效 */
        .right .el-button--primary.is-loading {
          background: linear-gradient(90deg, #7FE7C4 25%, #6DD5B8 50%, #7FE7C4 75%) !important;
          background-size: 200px 100% !important;
          animation: shimmer 1.5s infinite !important;
          pointer-events: none !important;
        }
  `
}

/**
 * 生成错误处理和动效的 JavaScript 代码
 */
export const generateOAScripts = (): string => {
  return `
    // 创建消息显示函数 - 简化版
    window.showOAMessage = function(message, type = 'error') {
      // 移除已存在的消息
      const existingMessage = document.querySelector('.oa-error-message, .oa-success-message');
      if (existingMessage) {
        existingMessage.remove();
      }

      // 创建新消息元素
      const messageEl = document.createElement('div');
      messageEl.className = type === 'error' ? 'oa-error-message' : 'oa-success-message';
      messageEl.textContent = message;
      document.body.appendChild(messageEl);

      // 3秒后自动移除
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.remove();
        }
      }, 3000);
    };

    // 拦截登录请求和响应
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const [url, options] = args;

      // 如果是登录请求，添加加载状态
      if (url && url.includes('/api/oa/login')) {
        const loginBtn = document.querySelector('.el-button--primary');
        if (loginBtn) {
          loginBtn.classList.add('is-loading');
          loginBtn.textContent = '登录中...';
        }
      }

      return originalFetch.apply(this, args).then(response => {
        // 处理登录响应
        if (url && url.includes('/api/oa/login')) {
          const loginBtn = document.querySelector('.el-button--primary');
          if (loginBtn) {
            loginBtn.classList.remove('is-loading');
            loginBtn.textContent = '登录';
          }

          if (response.ok) {
            response.clone().json().then(data => {
              if (data.code === 200) {
                window.showOAMessage('登录成功！', 'success');
                // 发送成功消息到主进程
                if (data.token && window.webviewApi) {
                  window.webviewApi.sendToHost('login-success', data.token);
                }
              } else {
                // 显示服务器返回的错误消息
                const errorMsg = data.message || data.msg || '登录失败，请检查账号密码';
                window.showOAMessage(errorMsg, 'error');

                // 添加输入框错误状态光效
                const inputs = document.querySelectorAll('.el-input__inner');
                inputs.forEach(input => {
                  input.classList.add('error');
                  setTimeout(() => {
                    input.classList.remove('error');
                  }, 3000);
                });
              }
            }).catch(err => {
              window.showOAMessage('登录响应解析失败', 'error');
            });
          } else {
            window.showOAMessage('网络请求失败，请检查网络连接', 'error');
          }
        }

        return response;
      }).catch(error => {
        // 处理网络错误
        if (url && url.includes('/api/oa/login')) {
          const loginBtn = document.querySelector('.el-button--primary');
          if (loginBtn) {
            loginBtn.classList.remove('is-loading');
            loginBtn.textContent = '登录';
          }
          window.showOAMessage('网络连接失败，请检查网络', 'error');
        }
        throw error;
      });
    };

    // 拦截 XMLHttpRequest（兼容性处理）
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
      this._url = url;
      return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
      if (this._url && this._url.includes('/api/oa/login')) {
        const loginBtn = document.querySelector('.el-button--primary');
        if (loginBtn) {
          loginBtn.classList.add('is-loading');
          loginBtn.textContent = '登录中...';
        }

        this.addEventListener('load', function() {
          const loginBtn = document.querySelector('.el-button--primary');
          if (loginBtn) {
            loginBtn.classList.remove('is-loading');
            loginBtn.textContent = '登录';
          }

          if (this.status === 200) {
            try {
              const data = JSON.parse(this.responseText);
              if (data.code === 200) {
                window.showOAMessage('登录成功！', 'success');
                if (data.token && window.webviewApi) {
                  window.webviewApi.sendToHost('login-success', data.token);
                }
              } else {
                const errorMsg = data.message || data.msg || '登录失败，请检查账号密码';
                window.showOAMessage(errorMsg, 'error');

                const inputs = document.querySelectorAll('.el-input__inner');
                inputs.forEach(input => {
                  input.classList.add('error');
                  setTimeout(() => {
                    input.classList.remove('error');
                  }, 3000);
                });
              }
            } catch (e) {
              window.showOAMessage('登录响应解析失败', 'error');
            }
          } else {
            window.showOAMessage('登录失败，服务器错误', 'error');
          }
        });

        this.addEventListener('error', function() {
          const loginBtn = document.querySelector('.el-button--primary');
          if (loginBtn) {
            loginBtn.classList.remove('is-loading');
            loginBtn.textContent = '登录';
          }
          window.showOAMessage('网络连接失败，请检查网络', 'error');
        });
      }

      return originalXHRSend.apply(this, arguments);
    };

    // 添加输入框状态处理 - 简化版
    document.addEventListener('DOMContentLoaded', function() {
      const inputs = document.querySelectorAll('.el-input__inner');
      inputs.forEach(input => {
        input.addEventListener('input', function() {
          if (this.value.trim()) {
            this.classList.remove('error');
            this.classList.add('success');
          } else {
            this.classList.remove('success');
          }
        });
      });
    });
  `
}

/**
 * 获取压缩后的注入样式
 */
export const getCompressedOAStyles = (): string => {
  return compressCSS(generateOAStyles())
}
