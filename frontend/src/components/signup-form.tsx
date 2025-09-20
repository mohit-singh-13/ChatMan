import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { signupService } from "@/services/authServices";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem("token");

    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSignup = async () => {
    if (!email || !password || !name || !confirmPassword) {
      toast("All fields are mandatory", { icon: "ℹ️" });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords doesn't match");
      return;
    }

    const response = await signupService(name, email, password);

    if (!response.success) {
      toast.error(response.message);
      return;
    }

    toast.success(response.message);
    navigate("/", { replace: true });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6 max-w-2xl mx-auto justify-center h-screen px-4",
        className
      )}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle>Create new account</CardTitle>
          <CardDescription>
            Create your new account by entering Email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                </div>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="button" className="w-full" onClick={handleSignup}>
                  Create Account
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link
                to={"/login"}
                replace
                className="underline underline-offset-4"
              >
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
