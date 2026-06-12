// typing.js
var typed = new Typed('#element', {
    strings: ['python', 'javascripts', 'c', 'cpp', 'java'],
    typeSpeed: 130,
    loop: true,
    loopCount: Infinity,
});

const token = localStorage.getItem("authToken");
const role = localStorage.getItem("userRole");
const name = localStorage.getItem("userName");

document.getElementById("studentBtn").addEventListener("click", function () {
    if (token) {
        if (role == 'student') {
            window.location.href = '/coding-test'
        }
        else {
            window.location.href = '/signin'
        }
    }
    else {
        window.location.href = '/signin'
    }
});

document.getElementById("teacherBtn").addEventListener("click", function () {
    window.location.href = "";
    if (token) {
        if (role == 'teacher') {
            window.location.href = '/create-test'
        }
        else {
            window.location.href = '/signin#teacher'
        }
    }
    else {
        window.location.href = '/signin#teacher'
    }
});

// loder
window.addEventListener("load", () => {
    setTimeout(() => {
        const loader = document.getElementById("loader");
        loader.classList.add("hide");

        setTimeout(() => {
            loader.remove(); // completely remove loader from DOM
        }, 500);
    }, 4000);
});
