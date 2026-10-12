import React from "react";
import {
    BrowserRouter,
    Switch,
} from "react-router-dom";
import AutheticatedNewRouting from "./navigation/autheticatedNewRouting";
import routes from "./navigation/routes";

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Switch>
                    {/* <Route path="/register" component={Register} />
                    <Route path="/login" component={Login} /> */}
                    {routes.map((route) => {
                        return (
                            <AutheticatedNewRouting
                                key={route.key}
                                path={route.path}
                                userComponents={
                                    route.userComponents
                                }
                                vendorComponents={
                                    route.vendorComponents
                                }
                            />
                        );
                    })}
                </Switch>
            </BrowserRouter>
        </div>
    );
}

export default App;
