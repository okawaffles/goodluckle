let keys = [
    'q','w','e','r','t','y','u','i','o','p',
    'a','s','d','f','g','h','j','k','l',
    'z','x','c','v','b','n','m'
];
const colemak = [
    'q','w','f','p','g','j','l','u','y',
    'a','r','s','t','d','h','n','e','i','o',
    'z','x','c','v','b','k','m'
];

function enable_keyboard() {
    keys.forEach(key => {
        document.getElementById(`key-${key}`).onclick = () => {
            const evt = new KeyboardEvent('keydown', {
                key: key.toUpperCase(),
                code: key.toUpperCase()
            });
            document.dispatchEvent(evt);
            console.log(`virtual keyboard key ${key} pressed`);
        }
    });

    document.getElementById('backspace').onclick = () => {
        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace'
        }))
    }
}

function set_layout(layout) {
    if (layout == 'colemak') {
        
    }
}