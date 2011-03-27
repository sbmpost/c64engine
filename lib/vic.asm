; first raster line with backgroundcolor: 51
; 12 cylces left border + 40 cylces screen + 11 cycles right border

; VIC constants

VIC = $D000

VIC_SPR_0_X     = $D000 
VIC_SPR_0_Y     = $D001 
VIC_SPR_1_X     = $D002 
VIC_SPR_1_Y     = $D003 
VIC_SPR_2_X     = $D004 
VIC_SPR_2_Y     = $D005 
VIC_SPR_3_X     = $D006 
VIC_SPR_3_Y     = $D007 
VIC_SPR_4_X     = $D008 
VIC_SPR_4_Y     = $D009
VIC_SPR_5_X     = $D00A
VIC_SPR_5_Y     = $D00B
VIC_SPR_6_X     = $D00C
VIC_SPR_6_Y     = $D00D
VIC_SPR_7_X     = $D00E
VIC_SPR_7_Y     = $D00F
VIC_SPR_X_MSB   = $D010

VIC_SPR_COORDS = VIC_SPR_0_X

    ; Bit 7: Bit 8 of $D012
    ; Bit 6: Extended Color Modus
    ; Bit 5: Hires-Bitmapmode
    ; Bit 4: Screen output enabled?
    ; Bit 3: 25 rows (24 otherwise)
    ; Bit 2..0: Offset in raster rows starting from the top screen edge
    ;       011 -> normal
    ;       100 -> 1 pixel down
    ;       010 -> 1 pixel up
VIC_CONTROL_Y   = $D011

    ; read: current line: 
    ; write: interrupt request at line
VIC_RASTER      = $D012
VIC_LIGHT_PEN_X = $D013
VIC_LIGHT_PEN_Y = $D014
VIC_SPR_ENABLE  = $D015

    ; Bit 7..5: unused
    ; Bit 4: Multicolor-Bitmapmode
    ; Bit 3: 40 cols (on)/38 cols (off)
    ; Bit 2..0: Offset in Pixels starting from the left screen edge
VIC_CONTROL_X   = $D016

VIC_SPR_EXP_Y   = $D017

    ; Bit 7..4: Address bits 11..8 of the screen memory within the 16KB of the VIC
    ; Bit 3..1: Address bits 11..8 of char generator (bit 0 is unused)
VIC_ADDR_SELECT = $D018

    ; read:
    ;   Bit 7: IRQ triggered by VIC
    ;   Bit 6..4: unused
    ;   Bit 3: request by Lightpen
    ;   Bit 2: request by sprite-sprite-collision (reg. $D01E)
    ;   Bit 1: request by sprite-background-collision (reg. $D01F)
    ;   Bit 0: request by raster line (reg. $D012)
    ; write:
    ;   setting a bit = appropriate interrupt flag is cleared
VIC_IRQ_STATUS  = $D019

    ; Is the appropriate bit set here and in $D019 
    ; an IRQ is triggered and bit 7 in $D019 is set
    ;
    ; Bit 7..4: unused
    ; Bit 3: IRQ triggered by lightpen
    ; Bit 2: IRQ triggered by S-S-collision 
    ; Bit 1: IRQ triggered by S-B-Kollision
    ; Bit 0: IRQ triggered by raster line 
VIC_IRQ_CONTROL = $D01A

VIC_SPR_PRIORITY= $D01B
VIC_SPR_MULTI   = $D01C
VIC_SPR_EXP_X   = $D01D
VIC_S_S_COLL    = $D01E
VIC_S_B_COLL    = $D01F
VIC_BORDER      = $D020
VIC_BACKGROUND_0= $D021
VIC_BACKGROUND_1= $D022
VIC_BACKGROUND_2= $D023
VIC_BACKGROUND_3= $D024

VIC_SPR_COLOR_01= $D025
VIC_SPR_COLOR_11= $D026

    ; color %10 in multi color mode
VIC_SPR_0_COLOR = $D027
VIC_SPR_1_COLOR = $D028
VIC_SPR_2_COLOR = $D029
VIC_SPR_3_COLOR = $D02A
VIC_SPR_4_COLOR = $D02B
VIC_SPR_5_COLOR = $D02C
VIC_SPR_6_COLOR = $D02D
VIC_SPR_7_COLOR = $D02E

!macro set_raster_line_8 .line {
    lda #(.line%256)
    sta VIC_RASTER
}

!macro set_raster_line_9 .line {
    lda #(.line%256)
    sta VIC_RASTER

    ; clear or set raster msb
    lda VIC_CONTROL_Y
!if .line < 256 {
    and #%01111111
} else {
    ora #%10000000
}
    sta VIC_CONTROL_Y
}

!macro set_raster_line_8 {
    sta VIC_RASTER
}

!macro set_raster_line_9 {
    sta VIC_RASTER

    ; clear raster msb
    lda VIC_CONTROL_1
    and #%01111111
    sta VIC_CONTROL_1
}

COLOR_RAM = $D800
