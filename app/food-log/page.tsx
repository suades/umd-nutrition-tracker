import Link from "next/link"
import { ArrowLeft, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FoodLog() {
  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Food Log</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Daily Nutrition Summary</CardTitle>
            <CardDescription>April 13, 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1 text-center">
                  <div className="text-3xl font-bold">1,200</div>
                  <div className="text-xs text-muted-foreground">Calories</div>
                  <div className="text-xs text-green-500">800 remaining</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-3xl font-bold">120g</div>
                  <div className="text-xs text-muted-foreground">Carbs</div>
                  <div className="text-xs text-green-500">40%</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-3xl font-bold">75g</div>
                  <div className="text-xs text-muted-foreground">Protein</div>
                  <div className="text-xs text-green-500">25%</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-3xl font-bold">40g</div>
                  <div className="text-xs text-muted-foreground">Fat</div>
                  <div className="text-xs text-green-500">30%</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1 text-center">
                  <div className="text-xl font-bold">25g</div>
                  <div className="text-xs text-muted-foreground">Fiber</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-xl font-bold">1,200mg</div>
                  <div className="text-xs text-muted-foreground">Sodium</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-xl font-bold">15g</div>
                  <div className="text-xs text-muted-foreground">Sugar</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-xl font-bold">800mg</div>
                  <div className="text-xs text-muted-foreground">Calcium</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="breakfast">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
            <TabsTrigger value="lunch">Lunch</TabsTrigger>
            <TabsTrigger value="dinner">Dinner</TabsTrigger>
            <TabsTrigger value="snacks">Snacks</TabsTrigger>
          </TabsList>
          <TabsContent value="breakfast" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Breakfast</CardTitle>
                <CardDescription>320 calories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">Oatmeal with Berries</div>
                      <div className="text-sm text-muted-foreground">1 cup</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">320 cal</div>
                      <div className="text-sm text-muted-foreground">45g C • 8g P • 12g F</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex w-full items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search foods..." className="w-full pl-8" />
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Food
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="lunch" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Lunch</CardTitle>
                <CardDescription>450 calories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">Chicken Salad</div>
                      <div className="text-sm text-muted-foreground">1 serving</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">450 cal</div>
                      <div className="text-sm text-muted-foreground">15g C • 40g P • 25g F</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex w-full items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search foods..." className="w-full pl-8" />
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Food
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="dinner" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Dinner</CardTitle>
                <CardDescription>430 calories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">Salmon with Vegetables</div>
                      <div className="text-sm text-muted-foreground">1 serving</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">430 cal</div>
                      <div className="text-sm text-muted-foreground">20g C • 35g P • 22g F</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex w-full items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search foods..." className="w-full pl-8" />
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Food
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="snacks" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Snacks</CardTitle>
                <CardDescription>0 calories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="text-muted-foreground">No snacks logged yet</div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex w-full items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search foods..." className="w-full pl-8" />
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Food
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
