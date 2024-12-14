import React, { Suspense } from "react";

const Login = React.lazy(() => import("../modules/auth/components/login"));

const Page = () => {
  return (
    <div>
      <Suspense fallback={<p>Loading...</p>}>
        <Login />
      </Suspense>
    </div>
  );
};

export default Page;
