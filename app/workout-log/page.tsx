import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Dumbbell, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function WorkoutLog() {
  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Workout Log</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Weekly Workout Summary</CardTitle>
            <CardDescription>April 7 - April 13, 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 text-center">
                  <div className="text-3xl font-bold">3</div>
                  <div className="text-xs text-muted-foreground">Workouts</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-3xl font-bold">125</div>
                  <div className="text-xs text-muted-foreground">Minutes</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-3xl font-bold">980</div>
                  <div className="text-xs text-muted-foreground">Calories</div>
                </div>
              </div>
              <div className="h-[100px] flex items-end gap-2">
                {[40, 65, 75, 50, 80, 60, 70].map((value, i) => (
                  <div key={i} className="relative flex-1">
                    <div
                      className="absolute bottom-0 w-full bg-green-500 rounded-sm"
                      style={{ height: `${value}%` }}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View Detailed Stats
            </Button>
          </CardFooter>
        </Card>

        <Tabs defaultValue="history">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Workout History</TabsTrigger>
            <TabsTrigger value="planned">Planned Workouts</TabsTrigger>
          </TabsList>
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recent Workouts</CardTitle>
                <CardDescription>Your last 5 workouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <Dumbbell className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Upper Body</div>
                        <div className="text-sm text-muted-foreground">Yesterday</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>45 minutes</span>
                        <span>•</span>
                        <span>320 calories</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <Dumbbell className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Cardio</div>
                        <div className="text-sm text-muted-foreground">2 days ago</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>30 minutes</span>
                        <span>•</span>
                        <span>280 calories</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <Dumbbell className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Lower Body</div>
                        <div className="text-sm text-muted-foreground">3 days ago</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>50 minutes</span>
                        <span>•</span>
                        <span>380 calories</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Log New Workout
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="planned" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Upcoming Workouts</CardTitle>
                <CardDescription>Your scheduled workouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Upper Body Strength</div>
                      <div className="text-sm text-muted-foreground">Tomorrow, 8:00 AM</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Cardio Session</div>
                      <div className="text-sm text-muted-foreground">Friday, 7:30 AM</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Lower Body Strength</div>
                      <div className="text-sm text-muted-foreground">Saturday, 9:00 AM</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule New Workout
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
