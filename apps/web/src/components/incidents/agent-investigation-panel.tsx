"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, BrainCircuit, ShieldAlert, FileText, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface AgentInvestigationPanelProps {
  incidentId: string
}

export function AgentInvestigationPanel({ incidentId }: AgentInvestigationPanelProps) {
  const [loading, setLoading] = useState(false)
  const [execution, setExecution] = useState<any>(null)
  
  const fetchExecutions = async () => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/agents`)
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          setExecution(data[0]) // Show most recent
        }
      }
    } catch (e) {
      console.error('Failed to fetch agent executions', e)
    }
  }

  useEffect(() => {
    fetchExecutions()
  }, [incidentId])

  const triggerInvestigation = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/incidents/${incidentId}/agents/investigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_type: 'full_investigation' })
      })
      if (res.ok) {
        fetchExecutions()
      }
    } catch (e) {
      console.error('Failed to trigger investigation', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Agentic AI Investigation</h3>
          <p className="text-sm text-muted-foreground">Run a LangGraph-powered autonomous investigation</p>
        </div>
        <Button onClick={triggerInvestigation} disabled={loading || (execution && execution.status === 'RUNNING')}>
          {loading || (execution && execution.status === 'RUNNING') ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Investigating...</>
          ) : (
            <><BrainCircuit className="mr-2 h-4 w-4" /> Start Investigation</>
          )}
        </Button>
      </div>

      {execution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Status: {execution.status}
            </CardTitle>
            <CardDescription>Requested by {execution.requested_by}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {execution.status === 'RUNNING' && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Investigation in Progress</AlertTitle>
                <AlertDescription>
                  The AI agents are querying OpenSearch, checking threat intel, and assessing risk...
                </AlertDescription>
              </Alert>
            )}
            
            {execution.status === 'COMPLETED' && (
              <div className="space-y-4">
                <Alert variant="default" className="bg-green-500/10 text-green-500 border-green-500/50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Investigation Complete</AlertTitle>
                  <AlertDescription>The Agentic AI has concluded its investigation.</AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
                   <Card className="bg-muted/50">
                     <CardHeader className="py-3 px-4">
                       <CardTitle className="text-sm flex items-center gap-2">
                         <ShieldAlert className="h-4 w-4" /> Risk Assessment
                       </CardTitle>
                     </CardHeader>
                     <CardContent className="py-2 px-4 text-sm">
                       Risk Level: High (Mocked Result) <br/>
                       Confidence: Medium
                     </CardContent>
                   </Card>
                   
                   <Card className="bg-muted/50">
                     <CardHeader className="py-3 px-4">
                       <CardTitle className="text-sm flex items-center gap-2">
                         <FileText className="h-4 w-4" /> Recommendations
                       </CardTitle>
                     </CardHeader>
                     <CardContent className="py-2 px-4 text-sm">
                       <ul className="list-disc pl-4 space-y-1">
                         <li>Isolate affected host</li>
                         <li>Block external IP</li>
                         <li>Rotate user credentials</li>
                       </ul>
                     </CardContent>
                   </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
