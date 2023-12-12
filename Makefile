CONFIG ?= config.default
-include $(CONFIG)

OUT       ?= engine
D64       ?= $(OUT).d64
KRILL     ?= ./krill
KRILL_URL ?= "http://csdb.dk/getinternalfile.php/196649/loader-v184.zip"
INC       ?= $(KRILL)/loader/build/loadersymbols-c64.inc
CC1541    ?= $(KRILL)/loader/tools/cc1541/cc1541
#EXO       ?= $(KRILL)/loader/tools/exomizer-3/src/exomizer
EXO       ?= ~/Downloads/exomizer-3.1.2/src/exomizer
TC        ?= $(KRILL)/loader/tools/tinycrunch_v1.2/tc_encode.py

ENGINE_ACME := engine.acme
ENGINE_EXO := $(ENGINE_ACME:.acme=.exo)
ENGINE_OBJ := $(ENGINE_ACME:.acme=.obj)
ENGINE_TC := $(wildcard *.bin)

map1.exo.bin.addr := '\x00\x48'
map2.exo.bin.addr := '\x00\x54'
colors.bin.addr := '\x00\x90'
screen.bin.addr := '\x00\x96'
pixels.bin.addr := '\x00\x9c'

# use 'make Q=' to get a verbose output of all commands
Q ?= @

all: $(D64)

$(INC):
	@echo '===> INSTALL KRILL LOADER'
	$(Q)$(WGET) $(KRILL_URL) -O krill.zip
	$(Q)$(MKDIR) $(KRILL)
	$(Q)$(UNZIP) krill.zip -d $(KRILL)
	$(Q)$(MAKE) -C $(KRILL)/loader

$(CC1541): $(INC)
	@echo '===> INSTALL CC1541'
	$(Q)$(MAKE) -C $(KRILL)/loader/tools/cc1541

$(EXO): $(INC)
	@echo '===> INSTALL EXOMIZER'
	$(Q)$(MAKE) -C $(KRILL)/loader/tools/exomizer-3/src

%.obj: %.acme $(INC)
	@echo '===> ACME $<'
	$(Q)$(ACME) -f cbm -DSYSTEM=64 -o $@ $<

$(ENGINE_EXO): $(ENGINE_OBJ) $(EXO)
	@echo '===> EXO $<'
	$(EXO) sfx sys $< -B -x1 -o $@

%.bin.prg: %.bin
	@echo '===> BIN to PRG $<'
	$(Q)printf $($(<).addr) | cat - $< > $@

%.tc: %.bin.prg $(INC)
	@echo '===> TC $<'
	$(Q)$(TC) -i $< $@

%.exo.prg: %.exo.bin
	@echo '===> EXO to PRG $<'
	$(Q)printf $($(<).addr) | cat - $< > $@

#%.exo: %.prg.exo $(INC)
map1.exo: map1.exo.prg $(INC)
	@echo '===> EXO $<'
	$(EXO) mem -B -l0x4800 -M256 -c $<,0x6000 -o $@

map2.exo: map2.exo.prg $(INC)
	@echo '===> EXO $<'
	$(EXO) mem -B -l0x5400 -M256 -c $<,0x6000 -o $@

#$(D64): $(CC1541) $(ENGINE_TC) $(ENGINE_EXO) map1.exo map2.exo
$(D64): $(CC1541) $(ENGINE_EXO) map1.exo map2.exo colors.tc screen.tc pixels.tc
	@echo '===> CC1541 $@'
	$(Q)$(CC1541) -n $(OUT) -f "$(OUT)#a0,8,1" -w $(ENGINE_EXO) -f map1 -w map1.exo -f map2 -w map2.exo -f colors -w colors.tc -f screen -w screen.tc -f pixels -w pixels.tc $(D64)

clean:
	@echo '===> CLEAN'
	$(Q)rm -f $(D64) $(ENGINE_EXO) *.exo *.tc *.obj *.prg krill.zip

distclean: clean
	@echo '===> DISTCLEAN'
	$(Q)rm -rf $(KRILL)

build: $(D64)
	@echo '===> BUILD $<'

run: $(D64)
	@echo '===> RUN $<'
	$(Q)$(X64) -device8 0 +iecdevice8 -drive8truedrive -8 $(D64)

dev:
	@echo '===> DEV'
	rm -f engine.prg
	$(Q)$(ACME) -DSYSTEM=64 -DDEVELOP=1 -DDEBUG=1 engine.acme

prg:
	@echo '===> PRG'
	rm -f engine.prg
	$(Q)$(ACME) -DSYSTEM=64 -DDEVELOP=1 engine.acme
