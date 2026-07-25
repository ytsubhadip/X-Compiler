// Override window.alert with a beautiful custom modal dialog
(function () {
    // Inject the CSS styles into the document head
    const style = document.createElement('style');
    style.innerHTML = `
        .custom-alert-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(13, 15, 18, 0.75);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.25s ease;
            pointer-events: none;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .custom-alert-overlay.show {
            opacity: 1;
            pointer-events: auto;
        }
        
        .custom-alert-card {
            background: #111418;
            border: 1px solid #1f242d;
            border-radius: 16px;
            padding: 30px;
            width: 90%;
            max-width: 440px;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
            transform: scale(0.9);
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            color: #ffffff;
        }
        
        .custom-alert-overlay.show .custom-alert-card {
            transform: scale(1);
        }
        
        .custom-alert-icon-container {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px auto;
            font-size: 28px;
            background: rgba(255, 255, 255, 0.05);
        }
        
        .custom-alert-icon-success {
            background: rgba(46, 200, 102, 0.15);
            color: #2ec866;
            border: 1px solid rgba(46, 200, 102, 0.25);
            box-shadow: 0 0 15px rgba(46, 200, 102, 0.1);
        }
        
        .custom-alert-icon-error {
            background: rgba(220, 38, 38, 0.15);
            color: #ef4444;
            border: 1px solid rgba(220, 38, 38, 0.25);
            box-shadow: 0 0 15px rgba(220, 38, 38, 0.1);
        }
        
        .custom-alert-icon-info {
            background: rgba(59, 130, 246, 0.15);
            color: #3b82f6;
            border: 1px solid rgba(59, 130, 246, 0.25);
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.1);
        }
        
        .custom-alert-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 12px;
            letter-spacing: -0.02em;
        }
        
        .custom-alert-message {
            font-size: 0.92rem;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 24px;
            white-space: pre-line;
            text-align: center;
            max-height: 250px;
            overflow-y: auto;
            padding: 0 4px;
        }
        
        .custom-alert-message::-webkit-scrollbar {
            width: 4px;
        }
        .custom-alert-message::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        
        .custom-alert-btn {
            background: #2ec866;
            color: #0f172a;
            border: none;
            border-radius: 8px;
            padding: 10px 24px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
            outline: none;
            box-shadow: 0 4px 12px rgba(46, 200, 102, 0.25);
        }
        
        .custom-alert-btn:hover {
            background: #3ee077;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(46, 200, 102, 0.35);
        }
        
        .custom-alert-btn:active {
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);

    // Global alert override
    window.alert = function (message) {
        const show = () => {
            let overlay = document.getElementById('customAlertOverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'customAlertOverlay';
                overlay.className = 'custom-alert-overlay';
                overlay.innerHTML = `
                    <div class="custom-alert-card">
                        <div class="custom-alert-icon-container" id="customAlertIcon"></div>
                        <div class="custom-alert-title" id="customAlertTitle">Notification</div>
                        <div class="custom-alert-message" id="customAlertMessage"></div>
                        <button class="custom-alert-btn" id="customAlertBtn">Dismiss</button>
                    </div>
                `;
                document.body.appendChild(overlay);
            }

            const iconContainer = document.getElementById('customAlertIcon');
            const titleElement = document.getElementById('customAlertTitle');
            const messageElement = document.getElementById('customAlertMessage');
            const btn = document.getElementById('customAlertBtn');

            // Clean up classes
            iconContainer.className = 'custom-alert-icon-container';

            // Convert message to string safely
            const msgStr = String(message);

            // Determine notification type (Success, Error, Info) based on text heuristics
            const lowerMsg = msgStr.toLowerCase();
            let iconHtml = '';
            let titleText = 'Alert';

            if (
                lowerMsg.includes('success') ||
                lowerMsg.includes('updated') ||
                lowerMsg.includes('🎉') ||
                lowerMsg.includes('perfectly') ||
                lowerMsg.includes('beautifully')
            ) {
                iconContainer.classList.add('custom-alert-icon-success');
                iconHtml = '<i class="bi bi-check-circle-fill"></i>';
                titleText = 'Success';
            } else if (
                lowerMsg.includes('error') ||
                lowerMsg.includes('failed') ||
                lowerMsg.includes('denied') ||
                lowerMsg.includes('prohibited') ||
                lowerMsg.includes('restriction') ||
                lowerMsg.includes('violation') ||
                lowerMsg.includes('terminated') ||
                lowerMsg.includes('strike') ||
                lowerMsg.includes('limit') ||
                lowerMsg.includes('🚨') ||
                lowerMsg.includes('⚠️')
            ) {
                iconContainer.classList.add('custom-alert-icon-error');
                iconHtml = '<i class="bi bi-exclamation-triangle-fill"></i>';
                titleText = 'Alert / Action Required';
            } else {
                iconContainer.classList.add('custom-alert-icon-info');
                iconHtml = '<i class="bi bi-info-circle-fill"></i>';
                titleText = 'Information';
            }

            iconContainer.innerHTML = iconHtml;
            titleElement.textContent = titleText;
            messageElement.textContent = msgStr;

            // Make button autofocusable/clickable
            btn.onclick = function () {
                overlay.classList.remove('show');
            };

            // Show the alert
            overlay.classList.add('show');
            btn.focus();
        };

        if (document.body) {
            show();
        } else {
            document.addEventListener('DOMContentLoaded', show);
        }
    };
})();
