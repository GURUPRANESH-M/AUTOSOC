"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, ShieldAlert, FileText, CheckCircle, Clock } from 'lucide-react'

interface ResponsePanelProps {
  incidentId: string
}

export function ResponsePanel({ incidentId }: ResponsePanelProps) {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchResponses = async () => {
    try {
      // Use full URL to bypass issues in local UI routing proxy for MVP
      const res = await fetch(`http://localhost:8000/api/v1/incidents/${incidentId}/responses`)
      if (res.ok) {
        const data = await res.json()
        setRecommendations(data)
      }
    } catch (e) {
      console.error('Failed to fetch responses', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResponses()
  }, [incidentId])

  const requestApproval = async (recId: string) => {
    await fetch(`http://localhost:8000/api/v1/responses/${recId}/request-approval`, { method: 'POST' })
    fetchResponses()
  }

  const approve = async (recId: string) => {
    await fetch(`http://localhost:8000/api/v1/responses/${recId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', reason: 'Analyst approved via UI' })
    })
    fetchResponses()
  }

  const execute = async (recId: string, mode: string) => {
    await fetch(`http://localhost:8000/api/v1/responses/${recId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendation_id: recId, mode })
    })
    fetchResponses() // Wait, execution might be async, but status updates soon
    setTimeout(fetchResponses, 2000)
  }

  if (loading) return <div>Loading response actions...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Response Actions & Containment</h3>
          <p className="text-sm text-muted-foreground">Manage approvals and execute containment playbooks securely.</p>
        </div>
      </div>

      {recommendations.length === 0 && (
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>No pending actions</AlertTitle>
          <AlertDescription>There are no response recommendations for this incident yet.</AlertDescription>
        </Alert>
      )}

      {recommendations.map(rec => (
        <Card key={rec.id} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-md flex items-center gap-2">
                  {rec.action_type === 'block_ip' ? 'Block IP Address' : rec.action_type}
                  <Badge variant="outline">{rec.impact} impact</Badge>
                  {rec.status === 'approved' && <Badge className="bg-green-600">Approved</Badge>}
                  {rec.status === 'pending_review' && <Badge className="bg-yellow-600">Pending Approval</Badge>}
                </CardTitle>
                <CardDescription className="mt-1">
                  Target: <strong>{rec.target_reference}</strong> | Playbook: {rec.playbook_id}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {rec.status === 'proposed' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => execute(rec.id, 'dry_run')}>Dry Run</Button>
                    <Button size="sm" onClick={() => requestApproval(rec.id)}>Request Approval</Button>
                  </>
                )}
                {rec.status === 'pending_review' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => execute(rec.id, 'simulation')}>Simulate</Button>
                    <Button variant="default" className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => approve(rec.id)}>Approve Action</Button>
                  </>
                )}
                {rec.status === 'approved' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => execute(rec.id, 'simulation')}>Simulate</Button>
                    <Button variant="destructive" size="sm" onClick={() => execute(rec.id, 'analyst_approved_execution')}>
                      Execute Containment
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Rationale:</strong> {rec.rationale}</p>
            <p><strong>Reversibility:</strong> {rec.reversibility}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
