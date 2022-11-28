const BASE_COLORS = [
    "#292F33",
    "#F5F8FA",
    "#DD2E44",
    "#FFCC4D",
    "#78B159",
    "#5DADEC"
];
const ERASER = "ERASER";
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d');

let path_started = false;
let emojilist = [],
    shuffled_emojis = [];
let currentColor = null;

function shuffleList(list) {
    let res = [], list_copy = list.slice();
    while (list_copy.length) {
        res = res.concat(
            list_copy.splice(
                Math.floor(Math.random()*list_copy.length), 1
            )
        );
    }
    return res;
}

/* Function adapted from https://github.com/twitter/twemoji/ */
function codeToUTF(emojicode) {
    return emojicode.split(/[-_]/).map( (c) => {
        let code = parseInt(c, 16);
        if (code < 0x10000) {
            return String.fromCharCode(code);
        }
        code -= 0x10000;
        return String.fromCharCode(
            0xD800 + (code >> 10),
            0xDC00 + (code & 0x3FF)
        );
    }).join('');
}
/* End of code */

function codeToURL(emojicode) {
    return `https://twemoji.maxcdn.com/v/latest/svg/${emojicode}.svg`;
}

function loadEmoji(emojidata) {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    document.getElementById('emojiname').textContent = emojidata.name;
    fetch(codeToURL(emojidata.code)).then(
        (resp) => resp.text()
    ).then((text) => {
        document.getElementById('original').innerHTML = text;
        let container = document.createElement('div');
        container.innerHTML = text;
        container.querySelector('svg').setAttribute('viewBox', '-1 -1 38 38');
        let graphics = Array.from(container.querySelectorAll('path,circle,rect,ellipse'));
        let fillColors = BASE_COLORS.slice();
        graphics.forEach((gr) => {
            let oldfill = gr.getAttribute("fill");
            if (oldfill) {
                if (fillColors.indexOf(oldfill) === -1) {
                    fillColors.push(oldfill);
                }
            }
            gr.setAttribute("fill","#ffffff");
            gr.setAttribute("stroke","#808080");
            gr.setAttribute("stroke-width",".2");
        });
        let palette = fillColors.map(
            (c) => `<button class="palettecolor" title="Paint in ${c}" style="background-color: ${c}" data-color="${c}"></button>`
        ).join('');
        document.getElementById('palette').innerHTML = palette;
        document.getElementById('painting').innerHTML = container.innerHTML;
    });
}

function loadRandomEmoji() {
    loadEmoji(shuffled_emojis.pop());
}

fetch("data/emojidata.json").then(
    (resp) => resp.json()
).then(
    (jsonresp) => {
        emojilist = jsonresp;
        shuffled_emojis = shuffleList(emojilist);
        loadRandomEmoji();
        console.log('Loading emojilist')
        document.getElementById('emojilist').innerHTML = emojilist.map(
            (emojidata) => {
                return `<button class="emojiselector" data-code="${emojidata.code}" title="${emojidata.name}">${codeToUTF(emojidata.code)}</button>`;
            }).join('');
    }
);

document.getElementById('random').addEventListener('click', loadRandomEmoji);

document.getElementById('list').addEventListener('click', e => {
    document.getElementById('emojilist-container').style.display = 'flex';
    document.getElementById('main').style.display = 'none';
});

document.getElementById('backbutton').addEventListener('click', e => {
    document.getElementById('emojilist-container').style.display = '';
    document.getElementById('main').style.display = '';
});

document.getElementById('emojilist').addEventListener('click', e => {
    let emojicode = e.target.getAttribute('data-code');
    if (emojicode) {
        let emojititle = e.target.getAttribute('title');
        document.getElementById('emojilist-container').style.display = '';
        document.getElementById('main').style.display = '';
        loadEmoji({
            'code': emojicode,
            'name': emojititle 
        });
    }
});

function resetPalette() {
    Array.from(document.getElementById('palette').children).forEach(
        c => (c.classList.replace('selected',null))
    );
    document.getElementById('eraser').classList.replace('selected',null);
}

document.getElementById('eraser').addEventListener('click',
    e => {
        resetPalette();
        document.getElementById('eraser').classList.add('selected');
        currentColor = ERASER;
    }
);

document.getElementById('palette').addEventListener('click',
    e => {
        let newcolor = e.target.getAttribute('data-color');
        if (newcolor) {
            resetPalette();
            e.target.classList.add('selected');
            currentColor = newcolor;
        }
    }
);

function mouseToCoords(mousevent) {
    let bounds = canvas.getBoundingClientRect();
    return [
        (mousevent.clientX - bounds.x) * (canvas.width / bounds.width),
        (mousevent.clientY - bounds.y) * (canvas.height / bounds.height)
    ];
}

function startPath(mousevent) {
    if (currentColor) {
        path_started = true;
        if (currentColor === ERASER) {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = currentColor;
        }
        ctx.lineWidth = document.getElementById('brushwidth').value;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(...mouseToCoords(mousevent));
    }
}

function continuePath(mousevent) {
    ctx.lineTo(...mouseToCoords(mousevent));
    ctx.stroke();
}

document.addEventListener('mouseup',
    e => {
        path_started = false;
    }
)

canvas.addEventListener('mousedown',
    e => {
        startPath(e);
    }
);

canvas.addEventListener('mousemove',
    e => {
        if (path_started) {
            continuePath(e);
            e.preventDefault();
        }
    }
);

document.addEventListener('touchend',
    e => {
        path_started = false;
    }
)

canvas.addEventListener('touchstart',
    e => {
        if (e.touches.length === 1) {
            startPath(e.touches[0]);
            e.preventDefault();
        }
    }
);

canvas.addEventListener('touchmove',
    e => {
        if (path_started && e.touches.length === 1) {
            continuePath(e.touches[0]);
            e.preventDefault();
        }
    }
);
