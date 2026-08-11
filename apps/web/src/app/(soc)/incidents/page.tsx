"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Incident {
    id: string
    title: string
    status: string
    severity: string
    risk_score: number
    alert_count: number
    created_at: string
}

export default function IncidentsPage() {
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch incidents from API
        fetch('http://localhost:8000/api/v1/incidents')
            .then(res => res.json())
            .then(data => {
                setIncidents(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Incidents</h2>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Active Incidents</CardTitle>
                    <CardDescription>
                        Correlated alerts requiring investigation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Risk</TableHead>
                                    <TableHead>Alerts</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {incidents.map((incident) => (
                                    <TableRow key={incident.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/incidents/${incident.id}`} className="hover:underline text-blue-500">
                                                {incident.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}>
                                                {incident.severity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{incident.status}</TableCell>
                                        <TableCell>{incident.risk_score}</TableCell>
                                        <TableCell>{incident.alert_count}</TableCell>
                                        <TableCell>{new Date(incident.created_at).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                                {incidents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No incidents found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
