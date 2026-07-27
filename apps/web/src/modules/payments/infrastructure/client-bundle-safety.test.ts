// @vitest-environment node
import { existsSync,readdirSync,readFileSync,statSync } from 'node:fs'
import path from 'node:path'
import { describe,expect,it } from 'vitest'

function files(dir:string,out:string[]=[]):string[]{if(!existsSync(dir))return out;for(const name of readdirSync(dir)){const full=path.join(dir,name);if(statSync(full).isDirectory())files(full,out);else if(name.endsWith('.js'))out.push(full)}return out}
describe('payments bundle safety',()=>{
  it('public domain barrel has no server dependencies',async()=>{
    const module=await import('#/modules/payments')
    expect('createServerSupabaseClient' in module).toBe(false)
  })
  it('client build contains no payment SQL implementation',()=>{
    const dist=path.resolve(__dirname,'../../../../dist/client');if(!existsSync(dist))return
    for(const file of files(dist)){const text=readFileSync(file,'utf8');expect(text).not.toMatch(/create or replace function public\.confirm_payment|service_role/)}
  })
})
