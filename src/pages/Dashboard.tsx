import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              AIVA <span className="text-primary">Flow</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome, {user?.email}</p>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>

        <div className="glass-strong p-12 text-center">
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">Dashboard coming soon</h2>
          <p className="text-muted-foreground text-sm">
            The full dashboard with health scores, AI recommendations, and project overview is being built next.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
