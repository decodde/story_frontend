var htmls = {
    bookCard: async (title, author, image) => {
        var default_img = //style = "background: url('tfa.jpg') !important; background-size: cover !important;";
        image ? default_img = `style="background: url(${image}) !important; background-size: cover !important;"` : "";
        return `<div class="book-container">
                    <div ${image ? default_img : ""}  class="${image ? "" : 'bg-abstract'} book-card" >
                    </div>
                    <p class="abril-text-regular na-title">${title}</p>
                    <p class="avenir-text-roman na-author">${author}</p>
                </div>`
    }
}

var _db_ = {
    keys: [["eS_firstTime", ""], ["eS_username", ""], ["eS_email", ""], ["eS_name",""], ["eS_loggedIn",""],["eS_recentRead",JSON.stringify([])],["eS_myStories",JSON.stringify([])],["eS_themeMode","light"]],
    retrieve: async (x) => {
        return localStorage.getItem(x);
    },
    save: async (key, value) => {
        return localStorage.setItem(key, value);
    },
    load: async () => {
        _db_.keys.forEach((key,n) => _db_.save(_db_.keys[n][0],_db_.keys[n][1]))
    },
    reset: async () => {
        _db_.keys.forEach(key => localStorage.removeItem(key[0]));
    }
}


const eStory = {
    _dom : {
        id : async (id) => document.getElementById(id),
        class : async (c) => document.getElementsByClassName(c),
        component : {
            homeUsername : {
                set : async (value) => (await eStory._dom.id("homeUsername")).innerHTML = value,
                get : async () => await (await eStory._dom.id("homeUsername")).innerText
            },
            loginForm : {
                get : async () => {
                    var username = await eStory._dom.id("loginUsername").value;
                    var password = await eStory._dom.id("loginPassword").value;
                    return {
                        username : username,
                        password : password
                    }
                }
            },
            signupForm : {
                get : async () => {
                    var username = await eStory._dom.id("signupUsername").value;
                    var email = await eStory._dom.id("signupEmailAddress").value;
                    var name = await eStory._dom.id("signupName").value;
                    var password = await eStory._dom.id("signupPassword").value;
                    return {
                        username : username,
                        password : password,
                        email : email,
                        name : name
                    }
                }
            },
            recentRead : {
                render : async (data) => {
                    (await eStory._dom.id("recentRead")).append(data);
                },
                clear : async () => (await eStory._dom.id("recentRead")).innerHTML = ""
            },
            myStories : {
                render : async (data) => {
                    (await eStory._dom.id("myStories")).append(data);
                },
                clear : async () => (await eStory._dom.id("recentRead")).innerHTML = ""
            },
            newArrivals : {
                render : async (data) => {
                    (await eStory._dom.id("newArrivals")).append(data);
                },
                clear : async () => (await eStory._dom.id("newArrivals")).innerHTML = ""
            }
        }
    },
    this: {
        loggedIn: _db_.retrieve("eS_loggedIn"),
        firstTime: _db_.retrieve("eS_firstTime"),
        username: _db_.retrieve("eS_username"),
        email: _db_.retrieve("eS_email"),
        apiKey: _db_.retrieve("eS_apiKey"),
        themeMode : _db_.retrieve("eS_themeMode"),
        recentRead : _db_.retrieve("eS_recentRead"),
        myStories : _db_.retrieve("eS_myStories")
    },
    _fetch: async (url, data, auth) => {
        var opt = {
            method: "POST",
            headers: {
                'Content-type': "application/json",
                'Authorization': ""
            }
        }
        auth ? opt.headers['Authorization'] = await eStory.this.apiKey : "";
        data ? opt.body = JSON.stringify(data) : delete opt.body;
        var _req = await fetch(`${server}/api/${url}`, opt);
        _req = await _req.json();
        return _req;
    },
    apiCall: {
        login: async (body) => await eStory.apiCall("login", body, false),
        signup: async (body) => await eStory.apiCall("onboard", body, false),
        story: {
            get: async (id) => await eStory.apiCall("story/get", { id: id }, false),
            create: async (body) => await eStory.apiCall("story/create", body, true),
            delete: async (id) => await eStory.apiCall("story/delete", { id: id }, true),
            myStories: async () => await eStory.apiCall("story/myStories", {}, true),
            all: {
                light: async () => await eStory.apiCall("story/stories/all/light", {}, false),
                detailed: async () => await eStory.apiCall("story/stories/all/detailed", {}, false),
            }
        },
        user: {
            get: async (username) => await eStory.apiCall("user/get", {}, true)
        }
    },
    notify : async (type,message,next) => {
        console.log(type.toUpperCase() + " :::> ",message);
        next();
    },
    switchView: {
        home: async () => {
           await eStory.switchView.view("home");
        },
        login: async () => {
            await eStory.switchView.view("login");
        },
        signup: async () => {
            await eStory.switchView.view("signup");
        },
        view: async (w, close) => {
            var views = document.getElementsByClassName("page");
            for (var i = 0; i < views.length; i++) {
                views[i].classList.replace("show", "hide")
            }
            if (w) {
                document.getElementById(w).classList.replace("hide", "show");
            }
        }
    },
    app : {
        loadHome : async () => {
            var user = "Guest";
            if (["null",null].includes(await eStory.this.loggedIn)){
                console.log("Not logged in");
                user ? user : user = "Guest";
            }
            else{
                user = await eStory.this.username;
                user ? user : user = "Guest";
            }
            await eStory._dom.component.homeUsername.set(user);
        },
        login : async () => {
            var loginBody = await eStory._dom.component.loginForm.get();
            var req = await eStory.apiCall.login(loginBody);
            if(req.type == "success"){
                Objects.keys(req.data).forEach(key => _db_.save(key,req.data[key]));
                _db_.save("eS_loggedIn",true);
                eStory.reload();
            }
            else{
                /* ##TODO notify error*/
                console.log("Login failed")
            }
        },
        signup : async () => {
            var signupBody = await eStory._dom.component.signupForm.get();
            var req = await eStory.apiCall.signup(signupBody);
            if (req.type == "success"){
                _db_.save("eS_email",signupBody.email);
                _db_.save("eS_name",signupBody.name);
                _db_.save("eS_username",signupBody.username);
                _db_.save("eS_apiKey",req.data.apiKey);
            }
            else {
                /*## TODO  notify error*/
                console.log("signup failed")
            }
        },
        recentRead : async () => {
            var _recRead = await eStory.app.recentRead;
            await eStory._dom.component.recentRead.clear();
            if (_recRead.length > 0){
                _recRead.forEach(async r => eStory._dom.component.recentRead.render(await htmls.bookCard(r.title,r.author,r.image)));
            }
        },
        myStories : async () => {
            var _mystories = await eStory.app.myStories;
            if(_mystories.length > 0 ){
                await eStory._dom.component.myStories.clear();
                _mystories.forEach(async r => eStory._dom.component.myStories.render(await htmls.bookCard(r.title,r.author,r.image)));
            }
            else {

            }
        }
    },
    start: async () => {
        eStory.switchView.view();
        /*once the app start :
            _db_.load for first time,
            themeMode shoud be updated,
            new Arrivals

        */
        if ([null, "null"].includes(await eStory.this.loggedIn)) {
            _db_.load();
            await eStory.switchView.home();
        }
        else {
            
            
        }
        /*Both logged in user and guest can view home;
        but a guest would only be able to read; he cant create a new book.
        whilst a loggedin user can read,create(-edit,update,delete);
        (/- not sure about rating, commenting yet-)

        */
        await eStory.app.loadHome();
        await eStory.app.myStories();
        await eStory.app.recentRead();
        await eStory.switchView.home();
    },
    reload: async () => {
        eStory.start();
    },
    reset: async () => {
        await _db_.reset();
        await eStory.reload();
    }
}
