




function changeTheme(){
    let checkbox = document.getElementById("light_dark_switch");

    if (checkbox.checked == true) {
        let aux = document.getElementsByClassName("lightMode");
        changeClass(aux, "lightMode", "darkMode");
        let out = document.getElementById("colorMode");
        out.innerHTML = 'darkMode enabled';

    } else {
        var aux = document.getElementsByClassName("darkMode");
        changeClass(aux, "darkMode", "lightMode");
        let out = document.getElementById("colorMode");
        out.innerHTML = 'lightMode enabled';
    }
}
function changeClass(vec, last, actual){
    //console.log(document.getElementsByClassName("lightMode"));
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




function lastPage(){
    return window.history.back();
}

