const BASE_COLORS = [
    "#292F33",
    "#F5F8FA"
];
const ERASER = "ERASER";
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d');

let path_started = false;
let emojilist = [];
let currentColor = null;

function loadEmoji() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let emojidata = emojilist[Math.floor(Math.random()*emojilist.length)];
    document.getElementById('emojiname').textContent = emojidata.name;
    fetch(emojidata.url).then(
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
            (c) => `<button class="palettecolor" style="background-color: ${c}" data-color="${c}"></button>`
        ).join('');
        document.getElementById('palette').innerHTML = palette;
        document.getElementById('painting').innerHTML = container.innerHTML;
    });
}

fetch("emojidata.json").then(
    (resp) => resp.json()
).then(
    (jsonresp) => {
        emojilist = jsonresp;
        loadEmoji();
    }
);

document.getElementById('random').addEventListener('click', loadEmoji);

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
