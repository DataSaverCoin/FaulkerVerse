/* Original canvas textures: concrete parking decks, civic stone and neighborhood brick. */
export function civicFacade(c,p)
{
    if(p.kind==='stifel')
    {
        c.fillStyle=p.wall;c.fillRect(0,0,1024,1024);c.strokeStyle='#ada592';c.lineWidth=2;
        for(let y=0;y<1024;y+=56)for(let x=(y/56%2)*100;x<1024;x+=200)c.strokeRect(x,y,200,56);
        c.fillStyle=p.trim;for(const y of [30,120,790,950])c.fillRect(0,y,1024,20);
        for(let i=0;i<8;i++){const x=i*128+38;c.fillStyle='#374247';c.fillRect(x,275,55,485);c.fillStyle='#b2ab91';c.fillRect(x+25,275,4,485);for(let y=300;y<760;y+=65)c.fillRect(x,y,55,3);}
    }
    if(p.kind==='garage')
    {
        c.fillStyle='#bbb9aa';c.fillRect(0,0,1024,1024);
        for(let level=0;level<9;level++)
        {
            const y=level*110;c.fillStyle='#24333a';c.fillRect(0,y+20,1024,68);
            c.fillStyle='#737e7d';c.fillRect(0,y+67,1024,12);
            c.fillStyle='#ece7d4';c.fillRect(0,y+89,1024,18);
            c.strokeStyle='#b2b7ad';c.lineWidth=2;
            for(let x=0;x<1024;x+=14){c.beginPath();c.moveTo(x,y+22);c.lineTo(x,y+85);c.stroke();}
            c.fillStyle='#929c91';for(let x=0;x<1024;x+=128)c.fillRect(x,y,16,110);
        }
        c.fillStyle=p.accent;c.fillRect(0,902,1024,45);
        c.fillStyle='#17282d';c.fillRect(128,950,260,74);c.fillRect(640,950,260,74);
        c.fillStyle='#e6bd42';for(const x of [112,390,624,900])c.fillRect(x,958,9,66);
    }
    if(p.kind==='jail')
    {
        c.fillStyle=p.wall;c.fillRect(0,0,1024,1024);c.strokeStyle='#9c998a';c.lineWidth=2;
        for(let y=0;y<1024;y+=64)for(let x=0;x<1024;x+=128)c.strokeRect(x,y,128,64);
        for(let x=42;x<1024;x+=160)
        {
            c.fillStyle='#4c7979';c.fillRect(x,55,70,715);
            c.fillStyle='#bed0c5';for(let y=55;y<770;y+=48)c.fillRect(x,y,70,4);
            c.fillStyle=p.trim;c.fillRect(x+32,55,5,715);
        }
        c.fillStyle=p.trim;c.fillRect(0,795,1024,100);
        c.fillStyle='#375c61';for(let x=105;x<1024;x+=160)c.fillRect(x,909,70,115);
    }
    if(p.kind==='soulard'||p.kind==='tinroof')
    {
        // Raised stone window hoods and a paneled pub frontage, drawn over brick.
        const bays=8,w=82,floor=880/p.floors;
        for(let f=0;f<p.floors-1;f++)for(let j=0;j<bays;j++)
        {
            const x=j*128+23,y=100+f*floor;
            c.fillStyle=p.trim;c.beginPath();c.ellipse(x+w/2,y+26,w/2+8,33,0,Math.PI,0);c.lineTo(x+w+8,y+43);c.lineTo(x-8,y+43);c.fill();
            c.fillStyle='#b19c73';c.fillRect(x,y+45,w,9);
        }
        c.fillStyle=p.accent;c.fillRect(0,805,1024,219);
        for(let j=0;j<8;j++)
        {
            const x=j*128+15;c.fillStyle='#d9af69';c.fillRect(x,839,95,132);
            c.fillStyle='#273638';c.fillRect(x+8,849,79,105);
            c.fillStyle='#d7aa64';c.fillRect(x+12,854,8,92);
            c.fillStyle=p.trim;c.fillRect(x+46,839,4,132);c.fillRect(x,893,95,4);
        }
    }
    if(p.kind==='urgentcare'||p.kind==='hospital')
    {
        c.fillStyle=p.accent;c.fillRect(0,80,1024,55);
        c.fillStyle='#e5e4da';c.fillRect(0,940,1024,84);
        c.fillStyle='#477880';for(let x=300;x<730;x+=110)c.fillRect(x,815,96,200);
        c.fillStyle='#d2e8df';c.fillRect(490,805,12,219);
    }
}
