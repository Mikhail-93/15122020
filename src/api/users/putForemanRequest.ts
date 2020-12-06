import {Request, Response} from "express";

import container from "@/di/container";
import {basename} from "path";
import context from "@/context/context";
import {getRepository} from "typeorm";
import {User} from "@entity/user/User.entity";
import plain from "@entity/user/plain";
import response from "@api/response";
import plainForCurrentUser from "@entity/user/plainForCurrentUser";
import merge from "@entity/user/merge";
import StatusEnum from "@entity/user/StatusEnum";
import RoleEnum from "@entity/user/RoleEnum";
import KError from "@/error/KError";
import transaction from "@/transaction/transaction";
import getContext from "@/context/getContext";
import setUserForeman from "@entity/user/setUserForeman";


/**
 *
 */
export default async function (req: Request, res: Response) {
  await transaction(async () => {
    const logger = container.createLogger({name: basename(__filename),})
    const {user, em} = getContext()
    const {id} = req.body

    // reset foreman
    if (user.foreman && id) {
      logger.info('reset foreman before new foreman request')
      await setUserForeman(user, null)
    }

    if (id) {
      const foreman = await em.findOneOrFail(User, id)
      if (foreman.status != StatusEnum.Confirmed || ![RoleEnum.Kopnik, RoleEnum.DanilovKopnik].includes(foreman.role)) {
        throw new KError('Invalid Foreman: has wrong status or role', 1510)
      }
      user.foremanRequest = foreman
    } else {
      user.foremanRequest = null
    }

    await em.save(user)
    res.json(response(true))
  })
}
