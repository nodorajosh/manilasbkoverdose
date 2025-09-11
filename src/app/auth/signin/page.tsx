import { Provider } from "@/components/providers";

import Main from "./main";

const SignInPage = async () => {
    return (
        <div>
            <Provider>
                <Main />
            </Provider>
        </div>
    )
};

export default SignInPage