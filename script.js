let songs = [];
let songindex = 0;
let rep = false;
let randx = false;
const { jsmediatags } = window;

//Declaring Variables for accessing different elements
let audioinput = document.getElementById("audi");
let pause = document.querySelector(".pause");
let play = document.querySelector(".play");
let repeat = document.querySelector(".repeat");
let next = document.querySelector(".next");
let prev = document.querySelector(".prev");
let shuffle = document.querySelector(".shuffle");
let mobileSlider = document.querySelector("#mediaprogress");
let desktopSlider = document.querySelector("#progress");
let albumImage=document.querySelector(".image");
const colorThief = new ColorThief();
let headlist=document.querySelector(".headlist")
let sidelist=document.querySelector(".playlist");

// Move updatePlayer to global scope
function updatePlayer(index) {
    if (!songs[index]) return;
    
    const songnow = songs[index];
    const audioPlayer = document.getElementById("audioPlayer");
    
    // Use jsmediatags to read metadata for the current song
    jsmediatags.read(songnow.file, {
        onSuccess: function (tag) {
            // Check if picture exists before processing
            if (tag.tags.picture && tag.tags.picture.data) {
                const data = tag.tags.picture.data;
                const format = tag.tags.picture.format || "image/jpeg";
                let base64string = "";
                
                for (let i = 0; i < data.length; i++) {
                    base64string += String.fromCharCode(data[i]);
                }
                
                // Using Color thief JS Library to change background color of the application when a new song is played based on it's album cover's colors 
                const albumArtImg = new Image();
                albumArtImg.onload = function(){
                    //Extract dominant and palette colors
                    let dominantCol = colorThief.getColor(albumArtImg);
                    let paletteCol = colorThief.getPalette(albumArtImg,5);
                    
                    //Convert RGB to CSS color
                    let dominantColCSS = `rgb(${dominantCol[0]},${dominantCol[1]},${dominantCol[2]})`;      
                    
                        //Apply background gradient
                        document.body.style.background = `linear-gradient(135deg,rgb(${dominantCol[0]},${dominantCol[1]},${dominantCol[2]},0.8) 0% ,rgb(${dominantCol[0]},${dominantCol[1]},${dominantCol[2]},0.8) 50%, rgba(0,0,0,0) 100%)`;

                        console.log(dominantColCSS);
                        
                    };
                    
                    //Set the image source
                    albumArtImg.src=`data:${format};base64,${window.btoa(base64string)}`;
                    
                    //Set album art
                    document.querySelector(".image").style.backgroundImage =`url(data:${format};base64,${window.btoa(base64string)})`;
                }else{
                    SetDefaultArt();
                }
            
            // Update text content
            document.querySelector(".title").textContent = tag.tags.title || songnow.title;
            document.querySelector(".artist").textContent = tag.tags.artist || "Unknown Artist";
        },
        onError: function (error) {
            console.log(error);
            // Fallback to file name if metadata reading fails
            document.querySelector(".title").textContent = songnow.title;
        }
    });
}

function SetDefaultArt(){
    let defimg= "assets/default-cover2.jpg";
    document.querySelector(".image").style.backgroundImage = `url(${defimg})`;
    document.body.style.background="linear-gradient(135deg, #FC00FF, #00DBDE)";
}





//Event Listener for toggling the button which hides the Song List
headlist.addEventListener("click",()=>{
    sidelist.classList.toggle("active");
})

//Event Listener to load songs when the input is toggled and also load all the songs selected in headlist element
audioinput.addEventListener("change", (e) => {
    songs =[];  //To Make Sure that in the running instance if someone reuploads songs from their storage again then it's updated and it starts playing songs from the reupdated song list 
    const files = Array.from(e.target.files);

    files.forEach((file) => {
        songs.push({
            file: file,
            title: file.name.split(".")[0]
        });
    });

    //Clear exisiting playlist;
    sidelist.innerHTML="";
    
    //Populate the playlist with songs
    files.forEach((file,index)=>{
        //Create a list item for each
        const songItem=document.createElement("li");
        songItem.classList.add("song-list");
        
        //Use File name without extenstion, padded with 0 for sorting
        const fileName=file.name.split('.')[0];
        songItem.textContent=`${(index + 1).toString().padStart(2,'0')}. ${fileName}`;
        
        songItem.addEventListener("click",()=>{
            pausedTime=0;
            resetRot();
            Play(index);    
        });
       
        pausedTime=0; //To Reset time if user suddenly decides to play a song so that playback doesn't start from the point where previous song was playing
        //Append to Playlist
        sidelist.appendChild(songItem);
    });

    // Play first song if songs are added
    if (songs.length > 0) {
        Play(0);
    }
});

let audioPlayer = document.getElementById("audioPlayer");
let isPlaying = false;
let pausedTime = 0;
audioPlayer.currentTime = 0;
let gindex;

function Play(index) {
    const songnow = songs[index];
    if (!songnow) return;
    
    if (songindex !== index) {
        pausedTime = 0;
    }
    songindex = index;
    
    if (audioPlayer.src !== URL.createObjectURL(songnow.file)) {
        audioPlayer.src = URL.createObjectURL(songnow.file)
    }
    
    let loadmetadata = new Promise((resolve) => {
        audioPlayer.addEventListener("loadeddata", () => {
            mobileSlider.max = 100;
            desktopSlider.max = 100;
            mobileSlider.value = 0;
            desktopSlider.value = 0;
            resolve();
        }, { once: true });
    });
    loadmetadata.then(() => {
        if (pausedTime > 0) {
            audioPlayer.currentTime = pausedTime;
        }
        else {
            pausedTime = 0;
        }
        gindex=index;
        audioPlayer.play();
        updatePlayer(index);
        isPlaying = true;
        play.innerHTML = `<i class='bx bx-pause-circle main-control '></i>`;
        
    });
    // Remove active class from all song items
    document.querySelectorAll(".song-list").forEach(item => {
        item.classList.remove("active-song");
    });
    
    // Add active class to the current song
    const songItems = document.querySelectorAll('.song-list');
    if (songItems[index]) {
        songItems[index].classList.add('active-song');
    }
    startRot();
}

function Pause(index) {
    if (isPlaying) {
        pausedTime = audioPlayer.currentTime;
        audioPlayer.pause();
        isPlaying = false;
        play.innerHTML = `<i class='bx bx-play-circle main-control '></i>`;
    }
    // else{
    //     Play(songindex);
    // }
    pauseRot();
}
play.addEventListener("click", () => {
    if (isPlaying == true) {
        Pause(songindex);
    }
    else {
        Play(songindex);
    }
});


let shuffleHistory=[];
let shuffileindex=-1;

next.addEventListener("click", () => {
    if (randx === true && !rep) {
        let newindex;
        do {
            newindex = Math.floor(Math.random() * songs.length);
        } while (songindex === newindex)

            shuffleHistory.push(newindex);
            shuffileindex= shuffleHistory.length-1;

            songindex=newindex;
            pausedTime = 0;
            resetRot();      
        }
        if (rep === true) {
            songindex = songindex;
            pausedTime = 0;
            resetRot();   
        }
        if (rep === false && randx === false) {
            songindex = (songindex + 1) % songs.length;
            pausedTime = 0;
            resetRot(); 
    }
    Play(songindex);
});

prev.addEventListener("click", () => {
    // if(rep===false && randx ===false){
    if (rep === false) {
        songindex = (songindex - 1 + songs.length) % songs.length;
        pausedTime = 0;
        resetRot();
    }
    if (rep === true) {
        songindex = songindex;
        pausedTime = 0;
        resetRot();
    }
    if(randx===true){
        if(shuffileindex>0){
            shuffileindex--;
            songindex=shuffleHistory[shuffileindex];
            pausedTime=0;
            resetRot();
        }
        else{
            songindex=Math.floor(Math.random()*songs.length);
            pausedTime=0;
            resetRot();
        }}
        Play(songindex);
    });

audioPlayer.addEventListener("ended", () => {
    
    songindex = (songindex + 1) % songs.length;
    Play(songindex);
});

//Logic for connecting keydown actions to music-playback
document.addEventListener("keydown", (event) => {
    const key = event.key;
    switch (key) {
        case " "://SpaceBar for Play/Pause
            event.preventDefault(); //To Prevent Page Scroll
            if (isPlaying) {
                Pause(songindex);
            } else {
                Play(songindex);
            }
            break;
        case "ArrowRight":
            songindex = (songindex + 1) % songs.length;
            pausedTime = 0;
            Play(songindex);
            break;
        case "ArrowLeft":
            songindex = (songindex - 1 + songs.length) % songs.length;
            pausedTime = 0;
            Play(songindex);
            break;
        case "ArrowUp":
            audioPlayer.volume = Math.min(1,audioPlayer.volume + 0.1);
            break;
        case "ArrowDown":
            audioPlayer.volume = Math.min(1,audioPlayer.volume - 0.1);
            break;
    }
})


const currentTimeEls = document.querySelectorAll(".current-time");
const TotalTimeEls = document.querySelectorAll(".total-time");

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

//Update progress and time display
function updateProgress() {
    const { currentTime, duration } = audioPlayer;

    //Update both mobile and desktop sliders
    if (duration > 0) {
        const progressPercent = (currentTime / duration) * 100;
        mobileSlider.value = progressPercent;
        desktopSlider.value = progressPercent;

        //Update time displays
        currentTimeEls.forEach(e => {
            e.textContent = formatTime(currentTime);
        });

        TotalTimeEls.forEach(e => {
            e.textContent = formatTime(duration || 0);
        });
    }
}

//Add event listener to update progress regularyl
audioPlayer.addEventListener("timeupdate", updateProgress);

//Add seek functionality to both sliders
function seekSong(event) {
    const slider = event.target;
    const { duration } = audioPlayer;

    //Calculate time based on slider position
    const seekTime = (slider.value / 100) * duration;

    //Set audio current time
    audioPlayer.currentTime = seekTime;
}


mobileSlider.addEventListener("input", seekSong);
desktopSlider.addEventListener("input", seekSong);

// Repeat or Shuffle Functionality ke liye alag se unke query selector banake songindex jo hai usi ko Math.Random karke use karenge aur Shuffle or Repeat naam ke 2 boolean (true or false) variables declare karke Next and Previous waale functions ki functionality ko if-else ka use kakre modify karenge claude ka jawaab bekar laga isko khud se implement karenge  

// let active=false;
console.log(rep);

repeat.addEventListener("click", () => {
    if (rep === false) {
        rep = true;
        repeat.style.color = "black";
        console.log(rep);
        // active=true;
    }
    else {
        rep = false;
        repeat.style.color = "white";
        console.log(rep);
    }
})

shuffle.addEventListener("click", () => {
    if (randx === false) {
        randx = true;
        shuffle.style.color = "black";
        console.log(randx);

        shuffleHistory=[];
        shuffileindex=-1;


        shuffleHistory.push(songindex);
        shuffileindex=0;
    }
    else {
        randx = false;
        shuffle.style.color = "white";
        console.log(randx);

        shuffleHistory=[];
        shuffileindex=-1;
    }
})

//Logic For Rotation of the album cover on playing
let rotationInterval;
let currentRotation = 0;

function startRot(){
    if(rotationInterval){
        clearInterval(rotationInterval);
    }

    rotationInterval = setInterval(() => {
        currentRotation = (currentRotation + 0.5) % 360;
        albumImage.style.transform = `rotate(${currentRotation}deg)`;
    }, 16);
}

//For Pausing the Rotation
function pauseRot(){
    if(rotationInterval){
        clearInterval(rotationInterval);
        rotationInterval=null;
    }
}

//For Resetting the Rotation
function resetRot(){
    //Reset rotation to 0
    currentRotation=0;
    albumImage.style.transform=`rotate(0deg)`;

    //Stop any ongoing rotation
    if(rotationInterval){
        clearInterval(rotationInterval);
        rotationInterval=null;
    }
}

let back=document.querySelector(".filechange");

back.addEventListener("click",()=>{
    audioinput.click();
})

//Work Left:- 
// 1) Make sure that for shuffle button all songs played using next are stored in an array and till the shuffle button is toggled off the previous button playsback all the songs played in the shuffled order (Done)
// 2) Use Color thief to change background color of the application when a new song is played based on it's album cover's colors (Done)
// 3) Make Sure that in the running instance if someone reuploads songs from their storage again then it's updated and it starts playing songs from the reupdated song list (Done)
// 4) Make a feature of a playlist view like a hamburger menu which shows a numbered list of all the uploaded songs and which shows the currently playing song in orange and an animation as the song moves like a normal car stereo player
//    also add the feature to play any song shown in the list when clicked on it and show grey background on every div of list when a cursor is hovered above it and it has a black background (Done)



