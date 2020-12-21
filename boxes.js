
function changeTheme(){
    let checkbox = document.getElementById("light/dark");

    if (checkbox.checked == true) {
        var aux = document.getElementsByClassName("lightMode");
        console.log(aux[0].classList)
        changeClass(aux, "lightMode", "darkMode");

    } else {
        var aux = document.getElementsByClassName("darkMode");
        console.log(aux[0].classList)
        changeClass(aux, "darkMode", "lightMode");

    }
}
function changeClass(vec, last, actual){
    console.log(document.getElementsByClassName("lightMode"));
    //Array.prototype.forEach.call(vec, obj => {
    for (const obj of vec) {
        obj.classList.remove(last);
        obj.classList.add(actual);
    }
    /*
    console.log(vec.lengh);
    for(let i = 0; vec[i]!=undefined; i++){
        vec[i].classList.add(actual);
        vec[i].classList.remove(last);
    }*/
    console.log(document.getElementsByClassName("lightMode"));

}



