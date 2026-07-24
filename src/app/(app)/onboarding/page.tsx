"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraduationCap, Info } from "lucide-react";
import { WhatIsOliwan } from "@/components/onboarding/WhatIsOliwan";
import { Training } from "@/components/onboarding/Training";
import { FindingBusinesses } from "@/components/onboarding/FindingBusinesses";
import { MockupProcess } from "@/components/onboarding/MockupProcess";
import { UsingTheCRM } from "@/components/onboarding/UsingTheCRM";

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onboarding</h1>
          <p className="text-muted-foreground text-sm">
            Todo lo que hay que saber sobre OLIWAN: qué vendemos, cómo encontramos clientes y cómo se usa el CRM.
          </p>
        </div>
      </div>

      <Tabs defaultValue="que-es" className="space-y-6">
        <TabsList variant="line" className="flex-wrap">
          <TabsTrigger value="que-es" className="cursor-pointer">Qué es OLIWAN</TabsTrigger>
          <TabsTrigger value="vendemos" className="cursor-pointer">Qué vendemos</TabsTrigger>
          <TabsTrigger value="negocios" className="cursor-pointer">Encontrar negocios</TabsTrigger>
          <TabsTrigger value="mockup" className="cursor-pointer">El mockup</TabsTrigger>
          <TabsTrigger value="crm" className="cursor-pointer">Cómo usar el CRM</TabsTrigger>
        </TabsList>

        <TabsContent value="que-es"><WhatIsOliwan /></TabsContent>
        <TabsContent value="vendemos"><Training /></TabsContent>
        <TabsContent value="negocios"><FindingBusinesses /></TabsContent>
        <TabsContent value="mockup"><MockupProcess /></TabsContent>
        <TabsContent value="crm"><UsingTheCRM /></TabsContent>
      </Tabs>

      <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-5xl">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          Si algo no está en el CRM, no existe. Mantén todo actualizado y visibilizado para que el
          equipo y la sociedad tomen mejores decisiones.
        </p>
      </div>
    </div>
  );
}
