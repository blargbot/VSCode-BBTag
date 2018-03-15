import { SubTagDefinition, Parameter } from '../subtagDefinition';

const subtag: SubTagDefinition = {
    name: 'usermention',
    title: 'Mentions a user',
    description: 'Uhhh',
    returns: 'text',
    parameters: [
        <Parameter>{
            name: 'user',
            accepts: 'user',
            required: false
        }
    ]
}

module.exports = subtag;