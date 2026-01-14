# Data Enhancement Script
# This script enhances the mock data with proper victim-suspect linkages for real-world scenarios

param(
    [string]$DataDir = "mock-data\enhanced-data-v2"
)

Write-Host "=== Enhancing Dataset for Real-World Victim-Suspect Linkages ===" -ForegroundColor Cyan

# Load existing data
$suspects = Import-Csv "$DataDir\suspects_enhanced.csv"
$victims = Import-Csv "$DataDir\victims_enhanced.csv"
$calls = Import-Csv "$DataDir\calls_enhanced.csv"
$cdr = Import-Csv "$DataDir\cdr_enhanced.csv"

Write-Host "Loaded: $($suspects.Count) suspects, $($victims.Count) victims, $($calls.Count) calls, $($cdr.Count) CDR records"

# Get suspect phones
$suspectPhones = $suspects | ForEach-Object { $_.phone }
$victimPhones = $victims | ForEach-Object { $_.phone }

# Enhanced calls - add some calls from suspects to victims
$enhancedCalls = @()
$callIndex = 0

foreach ($call in $calls) {
    $enhancedCall = $call.PSObject.Copy()
    
    # For every 5th call, make the receiver a victim (20% of calls target victims)
    if ($callIndex % 5 -eq 0 -and $callIndex -lt ($victimPhones.Count * 5)) {
        $victimIndex = [Math]::Floor($callIndex / 5)
        if ($victimIndex -lt $victimPhones.Count) {
            $enhancedCall.receiver_phone = $victimPhones[$victimIndex]
            $enhancedCall.matched_victim_id = $victims[$victimIndex].victim_id
        }
    }
    
    # For every 3rd call, make the caller a suspect
    if ($callIndex % 3 -eq 0) {
        $suspectIndex = $callIndex % $suspectPhones.Count
        $enhancedCall.caller_phone = $suspectPhones[$suspectIndex]
        $enhancedCall.matched_suspect_id = $suspects[$suspectIndex].suspect_id
    }
    
    $enhancedCalls += $enhancedCall
    $callIndex++
}

# Enhanced victims - add calling_suspects based on the calls we modified
$enhancedVictims = @()
foreach ($victim in $victims) {
    $enhancedVictim = $victim.PSObject.Copy()
    
    # Find suspects that called this victim
    $callersToVictim = $enhancedCalls | Where-Object { $_.receiver_phone -eq $victim.phone } | ForEach-Object { $_.matched_suspect_id } | Where-Object { $_ -ne "UNKNOWN" -and $_ -ne "" } | Select-Object -Unique
    
    if ($callersToVictim.Count -gt 0) {
        $enhancedVictim.calling_suspects = ($callersToVictim -join " | ")
    } else {
        # Assign random suspects for victims without calls
        $randomSuspects = $suspects | Get-Random -Count ([Math]::Min(3, $suspects.Count)) | ForEach-Object { $_.suspect_id }
        $enhancedVictim.calling_suspects = ($randomSuspects -join " | ")
    }
    
    $enhancedVictims += $enhancedVictim
}

# Enhanced CDR - link with suspects and victims
$enhancedCdr = @()
$cdrIndex = 0
foreach ($record in $cdr) {
    $enhancedRecord = $record.PSObject.Copy()
    
    # Link some CDR records to suspects and victims
    if ($cdrIndex % 4 -eq 0) {
        $suspectIndex = $cdrIndex % $suspectPhones.Count
        $enhancedRecord.caller_phone = $suspectPhones[$suspectIndex]
        $enhancedRecord.matched_suspect_id = $suspects[$suspectIndex].suspect_id
    }
    
    if ($cdrIndex % 6 -eq 0 -and $cdrIndex -lt ($victimPhones.Count * 6)) {
        $victimIndex = [Math]::Floor($cdrIndex / 6)
        if ($victimIndex -lt $victimPhones.Count) {
            $enhancedRecord.receiver_phone = $victimPhones[$victimIndex]
            $enhancedRecord.matched_victim_id = $victims[$victimIndex].victim_id
        }
    }
    
    $enhancedCdr += $enhancedRecord
    $cdrIndex++
}

# Save enhanced data
$enhancedCalls | Export-Csv "$DataDir\calls_enhanced.csv" -NoTypeInformation
$enhancedVictims | Export-Csv "$DataDir\victims_enhanced.csv" -NoTypeInformation
$enhancedCdr | Export-Csv "$DataDir\cdr_enhanced.csv" -NoTypeInformation

Write-Host "`n=== Enhancement Complete ===" -ForegroundColor Green

# Validate enhancements
$validatedCalls = Import-Csv "$DataDir\calls_enhanced.csv"
$validatedVictims = Import-Csv "$DataDir\victims_enhanced.csv"

$callsToVictims = $validatedCalls | Where-Object { $victimPhones -contains $_.receiver_phone }
$victimsWithSuspects = $validatedVictims | Where-Object { $_.calling_suspects -ne "NONE" -and $_.calling_suspects -ne "" }

Write-Host "Calls targeting victim phones: $($callsToVictims.Count) / $($validatedCalls.Count)"
Write-Host "Victims with calling_suspects: $($victimsWithSuspects.Count) / $($validatedVictims.Count)"
