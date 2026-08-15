import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <CardTitle>Rover Telemetry Portal</CardTitle>
          <CardDescription>CRISS Robotics drive team dashboard — foundation build</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>
            This is the project scaffold. Authentication, live telemetry, and the
            dashboard are implemented in later phases.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
