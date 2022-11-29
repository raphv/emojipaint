const BASE_COLORS = [
    "#000",
    "#FFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
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

function loadEmoji(emojidata) {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    document.getElementById('emojiname').textContent = emojidata.name;
    let svgdata = emojidata.svg_data;
    document.getElementById('original').innerHTML = `<svg viewBox="0 0 36 36">${svgdata}</svg>`;
    let container = document.createElement('div');
    container.innerHTML = `<svg viewBox="-1 -1 38 38">${svgdata}</svg>`;
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
    document.getElementById('eraser').classList.replace('selected',null);
    currentColor = fillColors[Math.floor(Math.random()*fillColors.length)];
    document.querySelector(`#palette button[data-color="${currentColor}"]`).classList.add('selected');
    document.getElementById('painting').innerHTML = container.innerHTML;
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
        let emojicontent = '', emlen = emojilist.length, currentcat = null;
        for (let i = 0; i < emlen; i++) {
            let emojidata = emojilist[i];
            if (emojidata.category !== currentcat) {
                currentcat = emojidata.category;
                emojicontent += `<h2>${currentcat}</h2>`;
            }
            emojicontent += `<button class="emojiselector" data-index="${i}" title="${emojidata.name}">
    <svg width="30" height="30" viewBox="0 0 36 36">${emojidata.svg_data}</svg>
</button>`;
        }
        document.getElementById('emojilist').innerHTML = emojicontent;
        Array.from(document.querySelectorAll('button.emojiselector')).forEach(btn => {
            let i = parseInt(btn.getAttribute('data-index'));
            btn.addEventListener('click', e => {
                document.getElementById('emojilist-container').style.display = '';
                document.getElementById('main').style.display = '';
                loadEmoji(emojilist[i]);
            });
        });
    }
);

document.getElementById('random').addEventListener('click', loadRandomEmoji);

document.getElementById('list').addEventListener('click', e => {
    document.getElementById('main').style.display = 'none';
    //force redraw to avoid user clicking early
    window.setTimeout(
        t => document.getElementById('emojilist-container').style.display = 'flex'
    );
});

document.getElementById('backbutton').addEventListener('click', e => {
    document.getElementById('emojilist-container').style.display = '';
    document.getElementById('main').style.display = '';
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
