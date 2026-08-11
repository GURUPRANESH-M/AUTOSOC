"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCorrelationPanel } from '@/components/incidents/alert-correlation-panel'
import { PredictionPanel } from '@/components/incidents/prediction-panel'
import { AgentInvestigationPanel } from '@/components/incidents/agent-investigation-panel'
import { ResponsePanel } from '@/components/incidents/response-panel'

interface IncidentDetail {
    id: string
    title: string
    status: string
    severity: string
    risk_score: number
    alert_count: number
    description: string
    created_at: string
}

export default function IncidentDetailPage({ params }: { params: { incidentId: string } }) {
    const [incident, setIncident] = useState<IncidentDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`http://localhost:8000/api/v1/incidents/${params.incidentId}`)
            .then(res => res.json())
            .then(data => {
                setIncident(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [params.incidentId])

    const updateStatus = async (newStatus: string) => {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/incidents/${params.incidentId}/status?status=${newStatus}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            })
            if (res.ok) {
                const updated = await res.json()
                setIncident(updated)
            }
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return <div className="p-8">Loading...</div>
    if (!incident) return <div className="p-8">Incident not found</div>

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{incident.title}</h2>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => updateStatus('investigating')}>Investigate</Button>
                    <Button variant="outline" onClick={() => updateStatus('resolved')}>Resolve</Button>
                    <Button variant="destructive" onClick={() => updateStatus('closed')}>Close</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{incident.status}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Severity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {incident.severity}
                        </Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{incident.risk_score}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Correlated Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{incident.alert_count}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="correlation">Alert Correlation</TabsTrigger>
                    <TabsTrigger value="prediction">Attack Prediction</TabsTrigger>
                    <TabsTrigger value="agents">AI Investigation</TabsTrigger>
                    <TabsTrigger value="responses">Response Actions</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PredictionPanel incidentId={params.incidentId} />
                        <Card>
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>{incident.description || 'No description provided.'}</p>
                                <p className="mt-4 text-sm text-muted-foreground">Created at: {new Date(incident.created_at).toLocaleString()}</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="timeline">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Timeline details will appear here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="alerts">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Correlated alerts will appear here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="notes">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Analyst notes will appear here.</p>
                        </CardContent>
                    </Card>
                <TabsContent value="correlation">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alert Correlation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AlertCorrelationPanel incidentId={params.incidentId} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="prediction">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attack Prediction</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PredictionPanel incidentId={params.incidentId} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="agents">
                    <Card>
                        <CardHeader>
                            <CardTitle>Agentic AI Investigation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AgentInvestigationPanel incidentId={params.incidentId} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="responses">
                    <Card>
                        <CardContent className="pt-6">
                            <ResponsePanel incidentId={params.incidentId} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
