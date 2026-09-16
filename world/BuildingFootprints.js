export function insideFootprint(x,z,points)
{
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++)
    {
        const a=points[i],b=points[j];
        if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    }
    return inside;
}
